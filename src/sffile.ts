import { PDTA } from './pdta';
import { reader } from './reader';
import * as sfTypes from './sf.types';
import assert from 'assert';
import { RenderCtx } from './render-ctx';
export class SF2File {
  pdta: PDTA;
  sdta: any;
  rend_ctx: RenderCtx;
  _bit16s: Buffer;
  _nsamples: number;
  constructor(path: string) {
    const r = reader(path);
    assert(r.read32String(), 'RIFF');
    let size: number = r.get32();
    assert(r.read32String(), 'sfbk');
    assert(r.read32String(), 'LIST');
    size -= 64;
    const sections: any = {};
    do {
      const sectionSize = r.get32();
      const section = r.read32String();
      size = size - sectionSize;
      if (section === 'pdta') {
        this.pdta = new PDTA(r);
      } else if (section === 'sdta') {
        assert(r.read32String(), 'smpl');
        const nsamples = (sectionSize - 4) / 2;
        const bit16s = r.readN(sectionSize - 4);
        const ob: Buffer = Buffer.alloc(nsamples * 4);
        const s16tof32 = (i16) => (i16 > 0 ? i16 / 0x7fff : -1 - i16 / 0x8000);
        for (let i = 0; i < nsamples; i++) {
          const n = bit16s.readInt16LE(i * 2);
          ob.writeFloatLE(s16tof32(n), i * 4);
        }
        this.sdta = {
          _floats: null,
          nsamples: this._nsamples,
          data: ob,
          bit16s: bit16s,
        };
      } else {
        r.skip(sectionSize);
      }
    } while (size > 0);
    this.rend_ctx = new RenderCtx(this);
  }

  findPreset = (props: sfTypes.FindPresetProps) => {
    const { bankId, presetId, key, vel } = props;
    const zones = this.pdta.findPreset(presetId, bankId, key, vel);
    return zones;
  };
}
