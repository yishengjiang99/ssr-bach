import { execSync } from "child_process";
import { openSync, readSync, write, writeSync } from "fs";
import { readFile, readFileSync } from "fs";
import { s16tof32 } from "./s16tof32";
import { ffp } from "./sinks";
const fd = openSync("./FluidR3_GM.sf2", "r");
const sampleSection = parseInt(execSync("strings -o FluidR3_GM.sf2 |grep sdtasmpl|cut -f2").toString().trim().split(" ")[0])+20;
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
      pitch,
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
      pitch,
    });
    return map;
  }, {});

function find(preset, midi, velocity, n: number): Buffer {
  const output = Buffer.allocUnsafe(n * 2 * 2);
  // console.log(Object.keys(csv[preset]), llk(midi) + "");
  const opts = csv[preset][llk(midi) + ""];
  if (!opts || opts.length < 1) {
    // console.log(preset, midi, velocity);
    return output;
  }
  let match;
  for (const item of opts) {
    const { lokey, hikey, lowvel, highvel } = item;

    if (hikey >= midi && lowvel <= velocity && highvel >= velocity) {
      match = item;
      break;
    }
  }
  
  const { offset, end, loopStart, endloop, pitch } = match;
  const playbackRatio = Math.pow(2, (midi - pitch) / 12);
  const sampleBufffer = Buffer.alloc(end - offset).fill(0)

  readSync(fd, sampleBufffer, 0, end - offset, offset+sampleSection);
  // console.log(sampleBufffer.slice(0, 16).toString());
 // writeSync(openSync("", "a"), output);
  for (let i = 0, j = 0; j < n-4 ; j++, i += playbackRatio) {
    if(i>endloop-offset-4){
      i=loopStart-offset;
    }
        const idx = ~~i;

    // const f = sampleBufffer.readInt16LE(idx) / 0x7fff;
    // output.writeFloatLE(f, j * 2 * 4);
    // output.writeFloatLE(f, j * 2 * 4 + 4);
    output.writeInt16LE(sampleBufffer.readInt16LE(idx),j*2*2);
    output.writeInt16LE(sampleBufffer.readInt16LE(idx),j*2*2+2)

  }
  return output;
}

export function resolveBuffer(note, ctx) {
  const n = ctx.sampleRate * note.durationTime;
  return find(note.instrument.number, note.midi, note.velocity * 0x7f, n);
}
let input=ffp({format:'s16le'});
let midi=44;
input.write(find(1, midi, 120, 38000))
input.write(find(1, midi++, 120, 38000))

input.write(find(1, midi++, 120, 38000))
input.write(find(1, midi++, 120, 38000))
input.write(find(1, midi++, 120, 38000))
input.write(find(1, midi++, 120, 38000))


