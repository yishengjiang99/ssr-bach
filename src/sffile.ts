import { PDTA } from './pdta';
import { reader } from './reader';
import * as sfTypes from './sf.types';
import assert from 'assert';
import { RenderCtx } from './render-ctx';
import { SFZone } from './Zone';
import { bufferReader } from './readmidi';

export class SF2File {
  pdta: PDTA;
  sdta: { nsamples: number; data: Buffer; bit16s: Buffer };
  rend_ctx: RenderCtx;
  static fromURL(url: string, cb) {
    fetch(url)
      .then((res) => res.arrayBuffer())
      .then((ab) => {
        const [riff, size, sfbk, list, skip, info] = new Uint32Array(ab, 0, 24);
      });
  }
  constructor(path: string = '') {
    if (path) {
      const r = reader(path);
      this.read(r);
    }
  }
  read(r) {
    let size: number = r.get32();

    size -= 64;
    const sections: any = {};
    do {
      const sectionSize = r.get32();
      const section = r.read32String();
      size = size - sectionSize;
      if (section === 'pdta') {
        this.pdta = new PDTA(r);
      } else if (section === 'sdta') {
        const nsamples = (sectionSize - 4) / 2;
        const bit16s = r.readN(sectionSize - 4);
        const ob: Buffer = Buffer.alloc(nsamples * 4);
        const s16tof32 = (i16) => i16 / 0xffff;
        for (let i = 0; i < nsamples; i++) {
          const n = bit16s.readInt16LE(i * 2);
          ob.writeFloatLE(s16tof32(n), i * 4);
        }
        this.sdta = {
          nsamples: nsamples,
          data: ob,
          bit16s: bit16s,
        };
      } else {
        r.skip(sectionSize);
      }
    } while (size > 0);
    this.rend_ctx = new RenderCtx(this);
  }

  findPreset = (props: sfTypes.FindPresetProps): SFZone[] => {
    const { bankId, presetId, key, vel } = props;
    const zones = this.pdta.findPreset(presetId, bankId, key, vel);
    return zones;
  };
}
