import { Writable } from "stream";
import { spawn } from "child_process";
import { convertMidi } from "./load-sort-midi";
import { openSync, readSync, closeSync } from "fs";
import { SSRContext, PulseSource } from "ssr-cxt";
import { NoteEvent } from "./ssr-remote-control.types";
import { sleep } from "./utils";

export const produce = (songname: string, output: Writable) => {
  const spriteBytePeSecond = 48000 * 1 * 4;
  const ctx = new SSRContext({
    nChannels: 1,
    bitDepth: 32,
    sampleRate: 48000,
    fps: 375,
  });

  const controller = convertMidi(songname);

  controller.setCallback(
    async (notes: NoteEvent[]): Promise<number> => {
      const startloop = process.uptime();

      notes.map((note, i) => {
        //if (i > 0) return;
        let velocityshift = 0; //note.velocity * 8;
        const bytelength = ~~((spriteBytePeSecond * note.durationTime) / 4) * 4;
        const file = `./midisf/${note.instrument}/${note.midi - 21}.pcm`;

        const fd = openSync(file, "r");

        const ob = Buffer.alloc(bytelength);
        if (note.durationTime < 1.0) {
          velocityshift = note.velocity * 8;
        }
        readSync(fd, ob, 0, bytelength, velocityshift);
        closeSync(fd);
        new PulseSource(ctx, {
          buffer: ob,
        });
      });

      ctx.pump();
      const elapsed = process.uptime() - startloop;

      await sleep(ctx.secondsPerFrame * 1000 - elapsed);
      return ctx.secondsPerFrame; // / 1000;
    }
  );

  controller.start();

  ctx.on("data", (d) => {
    output.write(d);
  });
  return controller;
};

// //produce("./bach_846-mid.mid", createWriteStream("day32.pcm"), null, "auto");
//produce("./song.mid", process.stdout, null, "auto");

// //createWriteStream("d, null, "auto");

//produce("./midi/bach_846-mid.mid", ffp(), null, "auto");
//precache("./song.mid", "ro2");
