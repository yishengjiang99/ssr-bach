import { assert } from "console";
import { readFileSync } from "fs";
import { BufferIndex } from "./ssr-remote-control.types";
import { s16tof32 } from "./s16tof32";
//@ts-ignore
let csv, filemem;
export function load(filename = './file.sf2') {
  filemem = readFileSync(filename);

  csv = readFileSync("./bitmap.csv")
    .toString()
    .split("\n")
    .reduce((map, line) => {
      const [
        name,
        preset,
        lokey,
        hikey,
        lowvel,
        highvel,
        offset,
        end,
        loop,
        endloop,
        samplerate,
        pitch,
      ] = line.split(",").map((t) => parseInt(t));

      map[preset] = map[preset] || [];
      map[preset].push({
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
        samplerate
      });
      return map;
    }, []);
  return [csv, filemem];
}

export function findIndex(presetId, midi, velocity): BufferIndex {
  const opts = csv[presetId];
  if (!opts || opts.length < 1)
  {
    return null;
  }
  let match = null;
  let pitchdiff = 88;
  for (const item of opts)
  {
    const { lokey, hikey, lowvel, highvel, pitch } = item;
    if (hikey >= midi && lokey <= midi && lowvel <= velocity && highvel >= velocity)
    {
      match = !match ? item : pitchdiff > parseInt(pitch) - midi ? item : match;

      break;
    }
  }
  if (!match) return null;

  const { offset, end, loop, endloop, pitch, samplerate } = match;
  const pitchratio = (Math.pow(2, (midi - pitch) / 12) * samplerate) / 48000;
  const looplength = endloop - loop;
  assert(looplength != NaN);
  return { offset, loop, endloop, pitchratio, looplength };
}

export function memcopy({ offset, endloop, pitchratio, looplength }: BufferIndex, output: Buffer, n: number) {

  for (let i = offset, j = 0; j < n; j += 8, i += pitchratio)
  {
    if (i > endloop - offset - 4)
    {
      i -= looplength;
    }

    const index = Math.floor(i); // javascript privileges hehe 
    assert(index != NaN, 'nan index');

    const v = filemem.readInt16LE(index);
    const f = s16tof32(v);
    if (j * 4 >= output.byteLength) break;
    output.writeFloatLE(f, j * 4);
    output.writeFloatLE(f, j * 4 + 4);
  }
  return output;
}
export function resolvebuffer(presetId, midi, velocity, seconds) {
  let n = seconds * 48000;

  const output = Buffer.allocUnsafe(n * 4 * 2);

  return memcopy(findIndex(presetId, midi, velocity), output, n);

}
