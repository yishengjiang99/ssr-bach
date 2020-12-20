import { PassThrough, Readable, Transform, Writable } from "stream";
import { convertMidi, convertMidiASAP, msPerBeat } from "./load-sort-midi";
import { FlatCache } from "nodejcached";
import { open, read, close, writeFileSync } from "fs";
import { basename } from "path";
import { SSRContext, ScheduledBufferSource } from "ssr-cxt";
import { MidiFile, NoteEvent } from "./ssr-remote-control.types";
import { sleep } from "./utils";
import { EventEmitter } from "events";
import { debug } from "webpack";
export const gencache = (songname: string) => {
  const audioSourceNotes = [];

  const spriteBytePeSecond = 48000 * 1 * 4;
  const c2 = new FlatCache(100, spriteBytePeSecond / 2, "halfsecond");
  const c4 = new FlatCache(100, spriteBytePeSecond / 4, "quartersecond");
  const c1 = new FlatCache(5, spriteBytePeSecond, "second");
  const { emitter } = convertMidiASAP(songname);
  const pt = new PassThrough();
  const script = {};
  emitter.on("note", (data) => {
    const path = `./midisf/${data.instrument}/${data.midi - 21}.pcm`;
    const cache = data.durationTime < 0.2 ? c2 : data.durationTime < 0.4 ? c4 : c1;
    const cacheKeyIndx = loadBuffer(path, cache);
  });

  emitter.on("ended", () => {
    c2.persist();
    c4.persist();
    c1.persist();
    Object.values(script).map((lines, trackId) => {
      writeFileSync("./db/script-" + basename(songname) + "-" + trackId + ".txt", lines.toString());
    });
  });
};

export function loadBuffer(file: string, noteCache: FlatCache) {
  if (noteCache && noteCache.cacheKeys.includes(file)) {
    return noteCache.cacheKeys.indexOf(file);
  } else {
    loadFile(noteCache, file);
    return noteCache.cacheKeys.indexOf(file);
  }
}
export function loadFile(noteCache: FlatCache, file: string): Buffer {
  const ob = noteCache.malloc(file);
  open(file, "r", (err, fd) => {
    err ||
      read(fd, ob, 0, ob.byteLength, 0, (err) => {
        err || close(fd, (err) => err);
      });
  });
  return ob;
}
export const produce = (songname: string, output: Writable) => {
  const spriteBytePeSecond = 48000 * 1 * 4;
  const ctx = new SSRContext({
    nChannels: 1,
    bitDepth: 32,
    sampleRate: 48000,
    fps: 10,
  });
  const inputevent = new EventEmitter();
  const c2 = new FlatCache(100, spriteBytePeSecond / 2, "halfsecond");
  const c4 = new FlatCache(100, spriteBytePeSecond / 4, "quartersecond");
  const c1 = new FlatCache(5, spriteBytePeSecond, "second");
  const controller = convertMidi(songname);
  controller.setCallback(
    async (notes: NoteEvent[]): Promise<number> => {
      // console.log(notes.map((n) => JSON.stringify(Object.values(n))).join("\n"));
      const startloop = process.uptime();
      const msPer16thBeat = msPerBeat(controller.state.tempo.bpm) / 4;
      ctx.fps = 1000 / msPer16thBeat;
      notes.map((note) => {
        const path = `./midisf/${note.instrument}/${note.midi - 21}.pcm`;
        const cache = note.durationTime < 0.2 ? c2 : note.durationTime < 0.4 ? c4 : c1;
        const ab = new ScheduledBufferSource(ctx, {
          start: ctx.currentTime,
          end: ctx.currentTime + note.durationTime,
          buffer: cache.read(path) || loadFile(cache, path), //, path),
        });
      });
      ctx.pump();
      //  await new Promise((resolve) => inputevent.on("pump", resolve));
      const elapsed = process.uptime() - startloop;
      await sleep(msPer16thBeat - elapsed * 1000);
      return msPer16thBeat / 1000;
    }
  );
  let lastframe;
  controller.start();

  ctx.on("data", (d) => {
    output.write(d);
  });

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
        inputevent.emit("pump");
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
        console.log(d.toString().trim());
        break;
    }
  });
};
