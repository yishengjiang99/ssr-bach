Object.defineProperty(exports, '__esModule', { value: true });
import * as pdta_1 from './pdta';
import { readAB } from './aba';
import { Runtime } from './runtime';

export async function uint8sf2(ab: Uint8Array) {
  const r = readAB(ab);
  const { readNString, get32, skip } = r;
  const [riff, filesize, sig, list, infosize] = [
    readNString(4),
    get32(),
    readNString(4),
    readNString(4),
    get32(),
  ];
  r.skip(infosize);
  console.log(riff, filesize, sig, list);
  console.log(readNString(4));
  const sdtaByteLength = get32();
  const sdtastart = 20 + infosize + 4 + 4;
  console.log(readNString(4), 'sdtastart', r.getOffset);
  const b16s = r.readN(sdtaByteLength - 4);
  console.log(readNString(4));
  console.log(get32());
  console.log(readNString(4));
  const pdta = new pdta_1.PDTA(r);
  const sfbk = {
    sdta: {
      bit16s: b16s,
      data: new Proxy(b16s, {
        get: (target, index) => {
          return target[index] / 0xffff;
        },
      }),
    },
    sdtastart: sdtastart,
    sdtaByteLength: sdtaByteLength,
    pdta,
    runtime: function (presetId, key, vel = 70, bankId = 0) {
      const zones = this.pdta.findPreset(presetId, bankId, key, vel);
      if (!zones || zones.length == 0) return false;
      return this.pdta.findPreset(presetId, bankId, key, vel).map((zone) => {
        const rt = new Runtime(
          zone,
          {
            key,
            velocity: vel,
          },
          48000
        );
        return rt;
      });
    },
  };
  return sfbk;
}
export function SFfromUrl(url) {
  return new Promise((resolve) => {});
}
