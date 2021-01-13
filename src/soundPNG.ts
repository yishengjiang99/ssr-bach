import { convertMidi, convertMidiASAP, msPerBeat } from "./load-sort-midi";
import { Transform, Writable } from "stream";
import { header } from "grep-wss";
import { cspawn, sleep } from "./utils";
import { createReadStream, existsSync, readSync, statSync, write, open } from "fs";
import { RemoteControl } from "./ssr-remote-control.types";
import { ServerResponse } from "http";
export const sampleSelect = async (file: string, offset: number) => {
  if (!existsSync(file)) return;

  createReadStream(file).pipe(
    new Transform({
      transform: (chunk, enc, cb) => {},
    })
  );
};

export const bitmapget = async (rc: RemoteControl, output: Writable): Promise<Buffer> => {
  const url = `js/runtime-${(Math.random() * 3222) >> 3}.png`;
  const proc = cspawn(
    `ffmpeg -f rawvideo -pixel_format b -video_size 88x300 -frames 33333 -i pipe:0 -f mp4 video.mp4 `
  );
  //88x300*3
  proc.stdout.on("error", (d) => console.error(d.toString()));

  let lastsent = 0;
  const bitmapp = Buffer.alloc(88 * 10 * 300 * 3).fill(0);
  rc.emitter.on("note", (e) => {
    let { midi, ticks, durationTicks } = e;
    midi = midi - 21;
    const ticks_ = ~~(ticks / 256);

    if (ticks_ * 88 * 3 - lastsent > 1024) {
      proc.stdin.write(bitmapp.slice(lastsent, ticks_ * 88 * 3));
      lastsent = ticks_ * 88 * 3;
    }

    for (let inc = Math.ceil(durationTicks / 256); inc > 0; inc--) {
      if (midi * ticks_ * 3 + 88 * 3 * inc > bitmapp.byteLength) {
        continue;
      }
      // console.log(midi * ticks_ * 3 + 88 * 3 + inc * 3);
      bitmapp.writeUInt8(0x99, midi * ticks_ * 3 + 88 * 3 * inc);
      bitmapp.writeUInt8(0x99, midi * ticks_ * 3 + 88 * 3 * inc + 1);
      bitmapp.writeUInt8(0x99, midi * ticks_ * 3 + 88 * 3 * inc + 2);
    }
  });

  return bitmapp;
};
