import { existsSync, closeSync } from "fs";
import { cspawn } from "./utils";
import { PulseSource, SSRContext } from "ssr-cxt";
import { Writable } from "stream";
import { convertMidi } from "./load-sort-midi";
import { NoteEvent, RemoteControl } from "./ssr-remote-control.types";
import { sleep } from "./utils";
import { get } from "https";
import { execSync } from "child_process";
import { resolveBuffer } from "./bytesPerNote";
import { ffp } from "./sinks";

const spriteBytePeSecond = 48000 * 2 * 4;
class PulseTrackSource extends PulseSource {
  note: NoteEvent;
  trackId: number;
  constructor(ctx, props: { buffer: Buffer; note: NoteEvent; trackId: number }) {
    super(ctx, { buffer: props.buffer });
    this.note = props.note;
    this.trackId = props.trackId;
  }
}
export class Player {
  nowPlaying: RemoteControl = null;
  ctx: SSRContext = new SSRContext({
    nChannels: 2,
    bitDepth: 32,
    sampleRate: 48000,
    fps: 375,
  });
  settings = {
    preamp: 1,
    threshold: -60, //0.001
    ratio: 4,
    knee: -40,
    playbackRate: 1,
  };
  output: Writable;
  setSetting = (attr, value) => {
    this.settings[attr] = value;
  };
  lastPlayedSettings = null;
  stop = () => {
    if (this.nowPlaying) this.nowPlaying.stop();
    if (this.output) this.output.end();
    if (this.timer) clearInterval(this.timer);
  };
  msg = (msg: string, reply: { write: (string) => void }): void => {
    let tt: string[] = msg.split(" ");
    const [cmd, arg1, arg2] = [tt.shift(), tt.shift(), tt.shift()];
    if (cmd === "config") {
      this.setSetting(arg1, parseFloat(arg2));
      return reply.write("ack config " + arg1 + " " + arg2);
    }
    if (this.nowPlaying && cmd === "seek") {
      this.nowPlaying.seek(parseInt(arg1));
      return reply.write({ rcstate: { seek: this.nowPlaying.state.time } });
    }
    switch (cmd) {
      case "resume":
        this.nowPlaying.resume();
        break;
      case "stop":
        this.nowPlaying.stop();
        this.nowPlaying.emitter.removeAllListeners();

        break;
      case "pause":
        this.nowPlaying.pause();
        break;
      default:
        reply.write("unknown handler " + cmd);
        break;
    }
  };
  playTrack = (
    file: string,
    output: Writable,
    autoStart: boolean = true,
    playbackRate: number = 1
  ): RemoteControl => {
    const ctx = this.ctx;
    const controller = convertMidi(file);
    this.nowPlaying = controller;
    this.tracks = new Array(controller.state.tracks.length);
    controller.setCallback(
      async (notes: NoteEvent[]): Promise<number> => {
        const startloop = process.uptime();

        notes.map((note, i) => {
          const bytelength = spriteBytePeSecond * note.durationTime;

          if (this.tracks[note.trackId]) {
            this.tracks[note.trackId].buffer = Buffer.alloc(0);
            this.tracks[note.trackId] = null;
          }
          this.tracks[note.trackId] = new PulseTrackSource(ctx, {
            buffer: resolveBuffer(note, bytelength),
            trackId: note.trackId,
            note: note,
          });
        });
        const elapsed = process.uptime() - startloop;
        await sleep((ctx.secondsPerFrame * 1000) / playbackRate);
        return ctx.secondsPerFrame;
      }
    );
    this.output = output;

    if (autoStart) controller.start();

    this.timer = setInterval(() => {
      const summingbuffer = new DataView(Buffer.alloc(ctx.blockSize).buffer);
      let inputViews: [Buffer, PulseTrackSource][] = this.tracks
        .filter((t, i) => t && t.buffer && t.buffer.byteLength >= ctx.blockSize)
        .map((t) => [t.read(), t]);

      const n = inputViews.length;

      for (let k = 0; k < ctx.blockSize; k += 4) {
        let sum = 0;
        for (let j = n - 1; j >= 0; j--) {
          sum +=
            (inputViews[j][0].readFloatLE(k) * inputViews[j][1].note.velocity * 1) / 2;
        }

        summingbuffer.setFloat32(k, sum, true);
      }

      if (!output.writableEnded) output.write(Buffer.from(summingbuffer.buffer));
    }, (ctx.secondsPerFrame * 1000) / playbackRate);

    output.on("close", () => {
      controller.stop();
      this.stop();
    });
    return controller;
  };
  timer: NodeJS.Timeout;
  tracks: PulseTrackSource[];
}
// new Player().playTrack("./midi/song.mid",ffp());