import { Writable } from "stream";
import { spawn } from "child_process";
import { convertMidi, convertMidiASAP } from "./load-sort-midi";
import { FlatCache, tieredCache, Multicache } from "flat-cached";
import { openSync, readSync, closeSync } from "fs";
import { SSRContext, PulseSource } from "ssr-cxt";
import { NoteEvent } from "./ssr-remote-control.types";
import { sleep } from "./utils";
const spriteBytePeSecond = 48000 * 1 * 4;
export const initcache = (preset) => {
  let multicache = tieredCache(preset, [
    spriteBytePeSecond / 4,
    spriteBytePeSecond / 2,
    spriteBytePeSecond,
    spriteBytePeSecond * 3,
  ]);
  return multicache;
};

export const precache = (songname: string, preset: string = "") => {
  const controller = convertMidi(songname);
  const multicache = initcache(preset);
  controller.setCallback(
    async (notes: NoteEvent[]): Promise<number> => {
      notes.map((data, i) => {
        const path = `./midisf/${data.instrument}/${data.midi - 21}.pcm`;
        console.log(path);
        loadBuffer(path, multicache, data.durationTime * spriteBytePeSecond);
      });
      return 10;
    }
  );

  controller.emitter.on("ended", () => {
    console.log("ended");
    multicache.persist();
    controller.stop();
  });
  controller.start();
};
//precache("song.mid", "ro24");
export function loadBuffer(file: string, noteCache: Multicache, size: number) {
  if (noteCache.read(file, size)) {
    return noteCache.read(file, size);
  } else {
    const ob = noteCache.malloc(file, size);
    return loadFile(ob, file);
  }
}

export function loadFile(ob: Buffer, file: string): Buffer {
  const fd = openSync(file, "r");
  readSync(fd, ob, 0, ob.byteLength, 1024);
  closeSync(fd);
  return ob;
}

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
};
// //precache(process.argv[2], "");

const ffp = () => {
  const { stdin, stderr, stdout } = spawn("ffplay", [
    "-i",
    "pipe:0",
    "-ac",
    "2",
    "-f",
    "f32le",
    "-ar",
    "48000",
  ]);
  stderr.pipe(process.stderr);
  stdout.pipe(process.stderr);
  return stdin;
};
const mp3c = () => {
  const { stdin, stderr, stdout } = spawn("ffmpeg", [
    "-loglevel",
    "debug",
    "-i",
    "pipe:0",
    "-ac",
    "2",
    "-f",
    "f32le",
    "-ar",
    "48000",
    "-acodec",
    "copy",
    "-",
  ]);
  stderr.pipe(process.stderr);
  stdout.pipe(process.stderr);
  return stdin;
};
// //produce("./bach_846-mid.mid", createWriteStream("day32.pcm"), null, "auto");
//produce("./song.mid", process.stdout, null, "auto");

// //createWriteStream("d, null, "auto");

//produce("./midi/bach_846-mid.mid", ffp(), null, "auto");
//precache("./song.mid", "ro2");
