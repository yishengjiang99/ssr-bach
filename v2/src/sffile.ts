import assert from "assert";
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
