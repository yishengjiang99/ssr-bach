import { convertMidi, convertMidiASAP, msPerBeat } from "./load-sort-midi";
import { Transform, Writable } from "stream";
import { header } from "grep-wss";
import { cspawn, sleep } from "./utils";
import { createReadStream, existsSync, readSync, statSync, write, open } from "fs";
export const sampleSelect = async (file: string, offset: number) => {
  if (!existsSync(file)) return;

  createReadStream(file).pipe(
    new Transform({
      transform: (chunk, enc, cb) => {},
    })
  );
};

export const bitmapget = async (midifile, output: Writable): Promise<Buffer> => {
  const { state, emitter, start } = convertMidiASAP(midifile);

  const url = `js/runtime-${(Math.random() * 33333) >> 3}.png`;
  const proc = cspawn(
    `ffmpeg -f rawvideo -pixel_format rgba -video_size 88x${
      Math.ceil(state.duration) * 3
    } -i pipe:0 -frames:v 1`
  );

  proc.stdout.on("error", (d) => console.error(d.toString()));

  output.write(url);
  let lastsent = 0;
  const bitmapp = Buffer.alloc(88 * Math.ceil(state.duration) * 3).fill(0);
  emitter.on("note", (e) => {
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

  start();

  return await new Promise((resolve, reject) =>
    emitter.on("end", () => resolve(bitmapp))
  );
};

export const peeks = (sampleFile: string, output: Writable) => {
  const sab = new SharedArrayBuffer(1024);
  const Uint32 = new Uint32Array(sab);
  Atomics.add(Uint32, 0, 1);
const f  openSync(sampleFile, "rb");



  if (err) throw err;
  const ob = Buffer.alloc(1024);
  let offset = 0;

  while (true) {
    readSync(fd, ob, 0, 1024, (offset += 1024));
    for (let i = 0; i < 1024; i += 4) {
      const dv: DataView = new DataView(ob.buffer);
      Atomics.add(Uint32, dv.getUint32(i, true), 1);
    }
  }
  output.write(Uint32.buffer):
});


};
