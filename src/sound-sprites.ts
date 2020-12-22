import { Writable } from "stream";
import { spawn } from "child_process";
import { convertMidi, convertMidiASAP } from "./load-sort-midi";
import { FlatCache, tieredCache, Multicache } from "flat-cached";
import { openSync, readSync, closeSync } from "fs";
import { SSRContext, PulseSource } from "ssr-cxt";
import { NoteEvent } from "./ssr-remote-control.types";
import { sleep } from "./utils";
import { Sequencer } from "./soundPNG";
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

export const produce = (
  songname: string,
  output: Writable,
  pngOutput: Writable,
  mode: "manual" | "auto" = "auto"
) => {
  const spriteBytePeSecond = 48000 * 1 * 4;
  const ctx = new SSRContext({
    nChannels: 1,
    bitDepth: 32,
    sampleRate: 48000,
  });
  const multicache = initcache("ro24");
  // console.log(ctx.blockSize);
  // return;

  const controller = convertMidi(songname);

  controller.setCallback(
    async (notes: NoteEvent[]): Promise<number> => {
      const startloop = process.uptime();

      notes.map((note, i) => {
        //if (i > 0) return;
        const velocityshift = 0; //note.velocity * 8;
        const bytelength = ~~((spriteBytePeSecond * note.durationTime) / 4) * 4;
        const file = `./midisf/${note.instrument}/${note.midi - 21}.pcm`;
        // let ob = loadBuffer(
        //   path,
        //   multicache,
        //   note.durationTime * spriteBytePeSecond
        // );
        // if (!ob) {
        //   console.error("ob not found for " + path);
        //   return;
        // }
        const fd = openSync(file, "r");
        const ob = Buffer.alloc(bytelength);
        readSync(fd, ob, 0, bytelength, 0);
        closeSync(fd);
        new PulseSource(ctx, {
          buffer: ob.slice(
            velocityshift,
            note.durationTime * spriteBytePeSecond + velocityshift
          ),
        });
      });

      ctx.pump();
      const elapsed = process.uptime() - startloop;

      if (mode === "manual") {
        await new Promise<void>((r2) =>
          process.stdin.on("data", (d) => {
            d.toString().trim() === "p" && r2();
          })
        );
      } else await sleep(ctx.secondsPerFrame * 1000 - elapsed);

      return ctx.secondsPerFrame; // / 1000;
    }
  );

  controller.start();

  ctx.on("data", (d) => {
    // console.log(d);
    output.write(d);
  });
  //  ctx.pipe(output);

  // ctx.on("data", (d) => {
  //   output.write(d);
  // });
  let debugloop = 0,
    idp = 0;
  process.stdin.on("data", (d) => {
    switch (d.toString().trim()) {
      case "s":
        controller.pause();
        break;
      case "r":
        controller.resume();
        break;
      case "d":
        console.log(controller.state);
        break;
      case "i":
        console.log(ctx.inputs[idp++ % ctx.inputs.length]);
        break;
      case "p":
        ctx.pump();
        break;
      case "l":
        const debugs = [
          [ctx.currentTime, ctx.playing],
          [controller.state],
          ctx.inputs.map(
            (i) => i.isActive(),
            ctx.inputs.map((i) => {
              [i.start, i.end, i.read().byteLength];
            })
          ),
        ];
        console.log(debugs[debugloop++ % debugs.length]);
        break;
      default:
        break;
    }
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
//produce("./song.mid", process.stdout, null, "auto");
