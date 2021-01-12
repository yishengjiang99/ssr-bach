import { Writable } from "stream";
import { convertMidi } from "./load-sort-midi";
import { openSync, readSync, closeSync, createWriteStream, existsSync } from "fs";
import { SSRContext, PulseSource, Envelope, Oscillator } from "ssr-cxt";
import { NoteEvent, RemoteControl } from "./ssr-remote-control.types";
import { cspawn, sleep } from "./utils";
import { Readable } from "stream";
import { PassThrough } from "stream";

export const produce = (
  songname: string,
  output: Writable = createWriteStream(songname + ".pcm"),
  interrupt: Readable = null,
  playbackRate: number = 1,
  autoStart: boolean = true
): RemoteControl => {
  const spriteBytePeSecond = 48000 * 1 * 4;
  const ctx = new SSRContext({
    nChannels: 1,
    bitDepth: 32,
    sampleRate: 48000,
    fps: 375,
  });
  let lastSettingsUsed;
  let intervalAdjust = 0;
  let settings = {
    preamp: 1,
    threshold: 55, //0.001
    ratio: 4,
    knee: 33,
  };
  const controller = convertMidi(songname);
  interrupt &&
    interrupt.on("data", (d) => {
      const t = d.toString().trim().split(" ");
      const [cmd, arg1, arg2, arg3] = [
        t.shift(),
        t.shift() || "",
        t.shift() || "",
        t.shift() || "",
      ];
      console.log(cmd, arg1, arg2);
      switch (cmd) {
        case "?":
          console.log(settings, lastSettingsUsed);
          break;
        case "backpressure":
          intervalAdjust += 1;
          break;
        case "config":
          if (settings[arg1]) {
            settings[arg1] = parseFloat(arg2);
            controller.emitter.emit("#meta", { ack: { arg1: settings[arg1] } });
          }
          break;
        default:
          break;
      }
    });
  controller.setCallback(
    async (notes: NoteEvent[]): Promise<number> => {
      const startloop = process.uptime();

      notes.map((note, i) => {
        let velocityshift = 0; //note.velocity * 8;
        let fadeoutTime = (1 - note.velocity) / 10;
        const bytelength = spriteBytePeSecond * note.durationTime;
        let file;
        if (note.instrument.includes("piano")) {
          fadeoutTime = 0;
          velocityshift = 48;

          file = `./midisf/${note.instrument}/${note.midi - 33}v${
            note.velocity > 0.4 ? "16" : note.velocity > 0.23 ? "8.5-PA" : "1-PA"
          }.pcm`;
        } else {
          file = `./midisf/${note.instrument}/${note.midi - 21}.pcm`;
        }

        if (!existsSync(file)) {
          file = `./midisf/clarinet/${note.midi - 21}.pcm`;
        } else {
          const fd = openSync(file, "r");

          const ob = Buffer.alloc(bytelength);
          if (note.durationTime < 1.0) {
            velocityshift = note.velocity * 1028;
          }
          readSync(fd, ob, 0, bytelength, velocityshift);
          closeSync(fd);
          new PulseSource(ctx, {
            buffer: ob,
          });
        }
      });
      let { preamp, threshold, knee, ratio } = settings;
      lastSettingsUsed = { preamp, compression: { threshold, knee, ratio } };
      ctx.pump({ preamp, compression: { threshold, knee, ratio } });
      const elapsed = process.uptime() - startloop;
      if (notes && notes[0] && notes[0].start > 10) {
        // controller.pause();
      }
      await sleep((ctx.secondsPerFrame / playbackRate) * 1000 - elapsed + intervalAdjust);

      return ctx.secondsPerFrame; // / 1000;
    }
  );
  let closed = false;

  if (autoStart) controller.start();
  output.on("close", (d) => {
    controller.stop();
    closed = true;
  });
  ctx.on("data", (d) => {
    if (controller.state.paused == false) output.write(d);
  });

  return controller;
};

if (require.main === module) {
  produce("midi/song.mid", cspawn("nc -l 8080").stdin, process.stdin);
  console.log("nc grepawk.com 8080 |ffplay -i pipe:0 -f f32le -ac 2 -ar 48000");
}
