import assert from "assert";
import { writeFileSync } from "fs";

import { parsePDTA } from "./pdta";

import { reader } from "./reader";
import { Zone } from "./sf.types";

export function sffile(path: string) {
  const r = reader(path);

  assert(r.read32String(), "RIFF");
  let size: number = r.get32();
  assert(r.read32String(), "sfbk");
  assert(r.read32String(), "LIST");
  size -= 64;
  const sections: any = {};
  do {
    const sectionSize = r.get32();
    const section = r.read32String();
    size = size - sectionSize;
    if (section === "pdta") {
      sections.pdta = {
        offset: r.getOffset(),
        data: parsePDTA(r),
      };
    } else if (section === "sdta") {
      sections.sdta = {
        offset: r.getOffset(),
        data: r.readN(sectionSize),
        sectionSize,
      };
    } else {
      r.skip(sectionSize);
    }
  } while (size > 0);

  return {
    ...sections,
    /**
     * @vsregion
     *
     * @param bankId
     * @param presetId
     * @param key
     * @param vel
     */
    getSample: function (
      bankId: number,
      presetId: number,
      key: number,
      vel: number
    ): Zone | null {
      if (
        !sections.pdta.data[bankId] ||
        !sections.pdta.data[bankId][presetId] ||
        !sections.pdta.data[bankId][presetId].zones
      ) {
        return null;
      }
      const presetZones = sections.pdta.data[bankId][presetId].zones;
      let candidate: Zone | null = null;
      let aggreDiff: number = 128 + 128;
      for (const z of presetZones) {
        if (z.velRange.lo > vel || z.velRange.hi < vel) continue;
        if (z.keyRange.lo > key || z.keyRange.hi < key) continue;
        const diff = vel - z.velRange.lo;
        candidate = candidate || z;
        aggreDiff = aggreDiff || diff;

        if (diff < aggreDiff) {
          candidate = z;
          aggreDiff = diff;
        }
      }

      return candidate;
    },
  };
}
const fff = sffile("./file.sf2");

const zone = fff.getSample(0, 0, 55, 33);
if (zone?.sample) {
  console.log(zone.sample);
  const sample = fff.sdta.data.slice(zone.sample.start * 2, zone.sample.end * 2);
  writeFileSync("here.pcm", sample);

  // const output = Buffer.alloc(48000 * 2);
  // for (let i = 0; i < 48000; i++) {
  //   const offset = zone.sample.start + i * 2;
  //   const number = fff.sdta.data.readInt16LE(offset);
  //   output.writeFloatLE(s16tof32(number), i * 4);
  // }
  // writeFileSync("here.pcm", output);
}
console.log(fff.sdta);
