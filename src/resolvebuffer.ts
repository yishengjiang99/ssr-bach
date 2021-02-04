import { openSync, readSync } from "fs";
import { readFile, readFileSync } from "fs";
const fd = openSync("./FluidR3_GM.sf2", "r");
const llk = (key) => (key < 27 ? 0 : Math.floor(key / 3) * 3);
const csv = readFileSync("./bitmap.csv")
  .toString()
  .split("\n")
  .reduce((map, line) => {
    const [
      preset,
      lokey,
      hikey,
      lowvel,
      highvel,
      offset,
      end,
      loop,
      endloop,
    ] = line.split(",").map((t) => parseInt(t));
    map[preset] = map[preset] || {};
    const ll = llk(lokey);
    map[preset][ll] = map[preset][ll] || [];
    map[preset][ll].push({
      preset,
      lokey,
      hikey,
      lowvel,
      highvel,
      offset,
      end,
      loop,
      endloop,
    });
    return map;
  }, {});

function find(preset, midi, velocity, buffer) {
  // console.log(Object.keys(csv[preset]), llk(midi) + "");
  const opts = csv[preset][llk(midi) + ""];
  if (!opts || opts.length < 1) {
    // console.log(preset, midi, velocity);
    return buffer;
  }
  let match;
  for (const item of opts) {
    const { lokey, hikey, lowvel, highvel } = item;

    if (hikey >= midi && lowvel <= velocity && highvel >= velocity) {
      match = item;
      break;
    } else {
    }
  }
  const { offset, end, loop, loopStart, endloop } = match;

  if (buffer.byteLength < end - offset) {
    readSync(fd, buffer, 0, buffer.byteLength, offset);
  } else {
    let loopd = end - offset;
    readSync(fd, buffer, 0, end - offset, offset);
    while (loopd < buffer.byteLength) {
      readSync(fd, buffer, loopd, Math.min(1024, buffer.byteLength - loopd), loopStart); //loop, 1024, loopd);
      loopd += 1024;
    }
  }
  return buffer;
}

export function resolveBuffer(note, ctx) {
  const ob = Buffer.from(new Int16Array(44100 * note.durationTime).fill(0));
  //  new Int16Array(44100 * note.durationTime).fill(0);
  find(note.instrument.number, note.midi, note.velocity * 0x7f, ob);
  return ob;
}
