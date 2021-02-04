import { existsSync, closeSync } from "fs";
import { cspawn } from "./cspawn";
import { SSRContext } from "ssr-cxt";
import { PassThrough, Writable } from "stream";
import { convertMidi } from "./load-sort-midi";
import { RemoteControl } from "./ssr-remote-control.types";
import { NoteEvent } from "./NoteEvent";
import { sleep } from "./utils";

import { devnull, ffp, lowpassFilter } from "./sinks";
import { PulseTrackSource } from "./PulseTrackSource";
import { resolveBuffer } from "./resolvebuffer";
const spriteBytePeSecond = 48000 * 2 * 4;

export class Player {
  nowPlaying: RemoteControl = null;
  ctx: SSRContext = new SSRContext({
    nChannels: 1,
    bitDepth: 16,
    sampleRate: 44100,
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
            buffer: resolveBuffer(note, ctx),
            trackId: note.trackId,
            note: note,
            velocity: note.velocity,
          });
        });
        const elapsed = process.uptime() - startloop;
        await sleep((ctx.secondsPerFrame * 1000) / playbackRate);
        return ctx.secondsPerFrame;
      }
    );
    this.output = output;

    if (autoStart) controller.start();
    ctx.nChannels = 1;
    ctx.bitDepth = 16;
    ctx.sampleRate = 44100;
    this.timer = setInterval(() => {
      const summingbuffer = Buffer.alloc(ctx.blockSize);
      let inputViews: [Buffer, PulseTrackSource][] = this.tracks
        .filter((t) => t.buffer)
        .map((t) => [t.read(), t]);

      const n = inputViews.length;
      let rsum = 0;
      for (let k = 0; k < ctx.blockSize - 2; k += 2) {
        let sum = 0;
        summingbuffer.setUint16(k, 0, true);

        for (let j = n - 1; j >= 0; j--) {
          sum = sum + inputViews[j][0].readUInt16LE(k) / n;
          // break;
        }
        rsum += sum;
        summingbuffer.setUint16(k, sum, true);
      }
      // console.log(rsum / 120);
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
new Player().playTrack(
  "./midi/song.mid",
  cspawn("ffplay -f s16le -i pipe:0 -ac 1 -ar 44100").stdin
);
