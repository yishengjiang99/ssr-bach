import { open, createReadStream } from "fs";
import { execSync, spawn } from "child_process";
import { FlatCache } from "flat-cached";
import { openSync, readSync, closeSync, close, createWriteStream } from "fs";
import { outputHelp } from "commander";

//import { FileSource } from "ssr-cxt";
const track = (csvfile: string, trackId, output) => {
  let lt = 0;
  execSync(`cat ${csvfile} |grep ',${trackId}'$`)
    .toString()
    .trim()
    .split("\n")
    .map((line) => {
      if (!line) return;
      const t = line.split(",");
      const start = parseInt(t[0]) / 256;
      if (lt) {
        const silent = start - lt;
        if (silent > 0) {
          const silentsound = Buffer.alloc(
            Math.floor((silent * spriteBytePeSecond) / 4) * 4
          ).fill(0);
          output.write(silentsound);
        }
      }
      const duration = parseInt(t[2]) / 256 / 4;
      const note = parseInt(t[1]) - 21;
      const inst = t[5].trim();
      const path = `./midisf/${inst}/${note}.pcm`;
      const ob = Buffer.alloc(
        Math.floor((duration * spriteBytePeSecond) / 4) * 4
      );
      const buff = loadFile(ob, path); //(path, duration);
      lt = start + duration;
      output.write(buff);
    });
};
const spriteBytePeSecond = 48000 * 1 * 4;

export function loadFile(ob: Buffer, file: string): Buffer {
  const fd = openSync(file, "r");
  readSync(fd, ob, 0, ob.byteLength, 64);
  closeSync(fd);

  return ob;
}

let i = 7;
track(
  "/Users/yisheng/Documents/GitHub/ssr-bach/csv/backstreet-boys-i-want-it-that-way-mid.csv",
  0,
  createWriteStream("bsb" + 0 + ".pcm")
);
/*
for (let i = 0; i < 14; i++) {
  track("song.csv", i, createWriteStream("track" + i + ".pcm"));
}
spawn(
  "ffmpeg",
  `${[2, 7, 8, 9, 11, 13]
    .map((i) => `-f f32le -ac 1 -ar 48000 -i track${i}.pcm`)
    .join(" ")} -filter_complex amix=inputs=6 -f f32le -`.split(" ")
).stdout.pipe(spawn("ffplay", "-f f32le -ac 1 -ar 48000".split(" ")).stdin);


let i=*/
