import * as pdta_1 from './pdta';
import { readAB } from './aba';
import { readFileSync } from 'fs';
import { Runtime } from './runtime';
import assert from 'assert';
import { initSDTA } from './sdta';
export async function uint8sf2(ab: Uint8Array) {
  const r = readAB(ab);
  const { readNString, get32, skip } = r;
  const [riff, filesize, sig, list] = [
    r.readNString(4),
    r.get32(),
    r.readNString(4),
    r.readNString(4),
  ];
  let infosize = get32();
  console.log(readNString(4), r.offset);

  console.log(infosize, r.offset);

  // while (infosize % 4 != 0) {
  //   // r.get8();
  //  // infosize++;
  // }
  r.skip(infosize - 4);
  console.log(readNString(4), r.offset);

  let sdtas = get32();
  console.log(readNString(4), r.offset);
  console.log(readNString(4), r.offset);
  const b16s = r.readN(sdtas - 4);

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
    sdtastart: 1,
    sdtaByteLength: 2,
    pdta,
    runtime: function (presetId: number, key: number, vel = 70, bankId = 0) {
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
