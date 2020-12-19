import { PassThrough, Readable, Transform, Writable } from "stream";
import { convertMidi } from "./load-sort-midi";
import { FlatCache } from "nodejcached";
import { open, read, close, writeFileSync, openSync } from "fs";
import { basename } from "path";
import { SSRContext, AudioDataSource } from "ssr-cxt";

export const gencache = (songname: string) => {
  const audioSourceNotes = [];

  const spriteBytePeSecond = 48000 * 1 * 4;
  const c2 = new FlatCache(100, spriteBytePeSecond / 2, "halfsecond");
  const c4 = new FlatCache(100, spriteBytePeSecond / 4, "quartersecond");
  const c1 = new FlatCache(5, spriteBytePeSecond, "second");
  const { emitter } = convertMidi(songname, false);
  const pt = new PassThrough();
  const script = {};
  emitter.on("note", (data) => {
    const path = `./midisf/${data.instrument}/${data.midi - 21}.pcm`;
    const cache =
      data.durationTime < 0.2 ? c2 : data.durationTime < 0.4 ? c4 : c1;
    const cacheKeyIndx = loadBuffer(path, cache);
  });

  emitter.on("ended", () => {
    c2.persist();
    c4.persist();
    c1.persist();
    Object.values(script).map((lines, trackId) => {
      writeFileSync(
        "./db/script-" + basename(songname) + "-" + trackId + ".txt",
        lines.toString()
      );
    });
  });

  function loadBuffer(file: string, noteCache: FlatCache) {
    let ob;
    const cacheKey = file;
    if (noteCache && noteCache.cacheKeys.includes(cacheKey)) {
      return noteCache.cacheKeys.indexOf(cacheKey);
    } else {
      const ob = noteCache.malloc(cacheKey);
      open(file, "r", (err, fd) => {
        err ||
          read(fd, ob, 0, ob.byteLength, 0, (err) => {
            err || close(fd, (err) => err);
          });
      });
      return noteCache.cacheKeys.indexOf(cacheKey);
    }
  }
};

export const produce = (songname: string) => {
  const spriteBytePeSecond = 48000 * 1 * 4;
  const ctx = new SSRContext({
    nChannels: 1,
    bitDepth: 32,
    sampleRate: 48000,
  });

  const c2 = new FlatCache(100, spriteBytePeSecond / 2, "halfsecond");
  const c4 = new FlatCache(100, spriteBytePeSecond / 4, "quartersecond");
  const c1 = new FlatCache(5, spriteBytePeSecond, "second");
  const { emitter } = convertMidi(songname, true);
  const pt = new PassThrough();
  const script = {};
  emitter.on("note", (data) => {
    script[data.trackId] = script[data.trackId] || "";
    const path = `./midisf/${data.instrument}/${data.midi - 21}.pcm`;
    const cache =
      data.durationTime < 0.2 ? c2 : data.durationTime < 0.4 ? c4 : c1;
    cache.read(path);

    const ab = new AudioDataSource(ctx, {});
  });
};
