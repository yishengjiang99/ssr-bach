import { PDTA } from './pdta.js';
import { readAB } from './aba.js';

export class SF2File {
  pdta!: PDTA;
  sdta!: { nsamples: number; data: Uint8Array };
  static fromURL: (url: string) => Promise<SF2File>;
  constructor(ab: Uint8Array) {
    const r = readAB(ab);
    console.assert(r.read32String(), 'RIFF');
    let size: number = r.get32();
    console.assert(r.read32String(), 'sfbk');
    console.assert(r.read32String(), 'LIST');
    size -= 64;
    const sections: any = {};
    do {
      const sectionSize = r.get32();
      const section = r.read32String();
      size = size - sectionSize;
      if (section === 'pdta') {
        this.pdta = new PDTA(r);
      } else if (section === 'sdta') {
        console.assert(r.read32String(), 'smpl');
        const nsamples = (sectionSize - 4) / 2;
        const uint8s = r.readN(sectionSize - 4);
        this.sdta = {
          nsamples,
          data: uint8s,
        };
      } else {
        r.skip(sectionSize);
      }
    } while (size > 0);
  }
}

if (typeof require != 'undefined') {
} else {
  SF2File.fromURL = async (url: string) => {
    return new SF2File(new Uint8Array(await (await fetch(url)).arrayBuffer()));
  };
}
