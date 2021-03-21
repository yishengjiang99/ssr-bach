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
        this._bit16s = r.readN(sectionSize - 4);
        this._nsamples = (sectionSize - 4) / 2;
        this.sdta = {
          nsamples: this._nsamples,
          data: this._bit16s,
          get floats() {
            const ob: Buffer = Buffer.alloc(sectionSize);
            for (let i = 0; i < sectionSize; i++)
              -ob.writeFloatLE(this.bit16s.readInt16LE(i * 2) / 0x7fff, i * 4);
            return ob;
          },
        };
      } else {
        r.skip(sectionSize);
      }
    } while (size > 0);
    this.rend_ctx = new RenderCtx(this);
  }

  findPreset = (props: sfTypes.FindPresetProps) => {
    const { bankId, presetId, key, vel } = props;
    return this.pdta.findPreset(presetId, bankId, key, vel);
  };
}
