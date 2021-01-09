import { Writable } from "stream";
import { spawn } from "child_process";
import { convertMidi } from "./load-sort-midi";
import { openSync, readSync, closeSync, createWriteStream, existsSync } from "fs";
import { SSRContext, PulseSource, Envelope } from "ssr-cxt";
import { NoteEvent, RemoteControl } from "./ssr-remote-control.types";
import { cspawn, sleep } from "./utils";
import { Readable } from "stream";

export const produce = (
  songname: string,
  output: Writable,
  interrupt?: Readable
): RemoteControl => {
  const spriteBytePeSecond = 48000 * 1 * 4;
  const ctx = new SSRContext({
    nChannels: 1,
    bitDepth: 32,
    sampleRate: 48000,
    fps: 375,
  });
  let intervalAdjust = 0;
  let settings = {
    preamp: 1,
    threshold: -60, //0.001
    ratio: 4,
    knee: -40,
  };
  const controller = convertMidi(songname);
  interrupt &&
    interrupt.on("data", (d) => {
      const t = d.toString().split(" ");
      const [cmd, arg1, arg2, arg3] = [
        t.shift(),
        t.shift() || "",
        t.shift() || "",
        t.shift() || "",
      ];

      switch (cmd) {
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
        let fadeoutTime = (10 - note.velocity) / 10;
        const bytelength = spriteBytePeSecond * note.durationTime;
        let file;
        if (note.instrument.includes("piano")) {
          fadeoutTime = 0;
          velocityshift = 48;

          file = `./midisf/${note.instrument}/${note.midi - 21}v${
            note.velocity > 0.4 ? "16" : note.velocity > 0.23 ? "8.5-PA" : "1-PA"
          }.pcm`;
        } else {
          file = `./midisf/${note.instrument}/${note.midi - 21}.pcm`;
        }
        // console.log(file, velocityshift, bytelength + bytelength);
        if (!existsSync(file))
          file = `./midisf/acoustic_grand_piano/${note.midi - 21}v8.pcm`;
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
      });
      let { preamp, threshold, knee, ratio } = settings;
      ctx.pump({ preamp, compression: { threshold, knee, ratio } });
      const elapsed = process.uptime() - startloop;
      if (notes && notes[0] && notes[0].start > 10) {
        // controller.pause();
      }
      await sleep(ctx.secondsPerFrame * 1000 - elapsed + intervalAdjust);

      return ctx.secondsPerFrame; // / 1000;
    }
  );
  let closed = false;

  controller.start();
  output.on("close", (d) => {
    controller.stop();
    closed = true;
  });
  ctx.on("data", (d) => {
    if (controller.state.paused == false) output.write(d);
  });
  return controller;
};
