import { convertMidi, convertMidiASAP } from "./load-sort-midi";
import { Writable } from "stream";

export const bitmapget = async (
  midifile,
  output: Writable
): Promise<Buffer> => {
  const { state, emitter, start } = convertMidiASAP(midifile);
  //
  console.log(state);
  const url = `js/runtime-${(Math.random() * 33333) >> 3}.png`;
  const proc = require("child_process").spawn(
    `ffmpeg`,
    `-f rawvideo -pixel_format rgba -video_size 88x${
      Math.ceil(state.duration) * 3
    } -i pipe:0 -frames:v 1 ${url}`.split(" ")
  );
  proc.stdout.on("error", console.error);

  output.write(url);
  //emitter.on("#tempo", console.log);
  let lastsent = 0;
  const bitmapp = Buffer.alloc(88 * Math.ceil(state.duration) * 3).fill(0);
  emitter.on("note", (e) => {
    let {
      midi,
      instrument,
      ticks,
      durationTicks,
      velocity,
      noteOffVelocity,
      trackId,
    } = e;
    midi = midi - 21;
    const ticks_ = ~~(ticks / 256);

    if (ticks_ * 88 * 3 - lastsent > 1024) {
      proc.stdin.write(bitmapp.slice(lastsent, ticks_ * 88 * 3));
      lastsent = ticks_ * 88 * 3;
    }

    for (let inc = Math.ceil(durationTicks / 256); inc > 0; inc--) {
      if (midi * ticks_ * 3 + 88 * 3 * inc > bitmapp.byteLength) {
        console.log(midi, ticks_, inc);
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
    emitter.on("end", () => {
      console.log(bitmapp);
      resolve(bitmapp);
    })
  );
};
bitmapget("./song.mid", process.stdout);
