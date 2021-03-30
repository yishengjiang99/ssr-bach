import { existsSync, closeSync } from "fs";
import { cspawn } from "./utils";
import { PulseSource, SSRContext, Envelope } from "ssr-cxt";
import { PassThrough, Writable } from "stream";
import { convertMidi } from "./load-sort-midi";
import { NoteEvent, RemoteControl } from "./ssr-remote-control.types";
import { sleep } from "./utils";

import { devnull, ffp, lowpassFilter } from "./sinks";
import { SF2File } from "./resolvesf/sffile";
const sff = new SF2File("./sf2/file.sf2");
const secondsPerFrame = 1 / 48000;
const spriteBytePeSecond = 48000 * 2 * 4;
class PulseTrackSource extends PulseSource {
  note: NoteEvent;
  trackId: number;
  envelope: Envelope;
  constructor(
    ctx,
    props: { buffer: Buffer; note: NoteEvent; trackId: number; velocity: number }
  ) {
    super(ctx, { buffer: props.buffer });
    this.note = props.note;
    this.trackId = props.trackId;
    this.envelope = new Envelope(48000, [
      ((145 - props.velocity) / 144) * 0.1,
      0.1,
      0.4,
      0.4,
    ]);
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
    const ctx = sff.rend_ctx;

    const controller = convertMidi(file);
    this.nowPlaying = controller;
    controller.state.tracks.forEach((t, i) => {
      ctx.programs[i] = {
        bankId: t.percussion ? 128 : 0,
        presetId: t.instrument,
      };
    });
    controller.setCallback(
      async (notes: NoteEvent[]): Promise<number> => {
        const startloop = process.uptime();
        notes.map((note, i) => {
          ctx.keyOn(
            note.midi,
            note.velocity * 0x7f,
            note.durationTime * 5,
            note.start - controller.state.time + 0.4,
            note.trackId
          );
          console.log(
            note.start - controller.state.time,
            note.start + note.durationTime - controller.state.time
          );
          // ctx.keyOff(
          //   note.trackId,
          //   note.start + note.durationTime - controller.state.time
          // );
        });
        const elapsed = process.uptime() - startloop;
        await sleep(100 - elapsed);
        //   console.log(ctx.voices.filter((v) => v && v.length > 0));
        return 0.1;
      }
    );
    this.output = output;

    if (autoStart) controller.start();

    let locked = 0;
    this.timer = setInterval(() => {
      if (locked == 1) return;
      locked = 1;
      output.write(ctx.render(128));
      locked = 0;
    }, (secondsPerFrame * 1000) / playbackRate);

    output.on("close", () => {
      controller.stop();
      this.stop();
    });
    return controller;
  };
  timer: NodeJS.Timeout;
  tracks: PulseTrackSource[];
}
new Player().playTrack("midi/song.mid", ffp()); // lowpassFiler(4000).stdout.pipe(ffp()));
