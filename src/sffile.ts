import { PDTA } from './pdta';
import { reader } from './reader';
import * as sfTypes from './sf.types';
import assert from 'assert';
import { RenderCtx } from './render-ctx';
import { SFZone } from './Zone';
import { std_inst_names } from './utilv1';
import { cspawn } from './cspawn';

export class SF2File {
  pdta: PDTA;
  sdta: { nsamples: number; data: Buffer; bit16s: Buffer };
  rend_ctx: RenderCtx;
  path: string;
  constructor(path: string = '') {
    const r = reader(path);
    this.path = path;
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
        const bit16s = r.readN(sectionSize - 4) as Buffer;
        const ob: Buffer = Buffer.alloc(nsamples * 4);
        const s16tof32 = (i16: number) => i16 / 0xffff;
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

  findPreset(props: sfTypes.FindPresetProps): SFZone[] {
    const { bankId, presetId, key, vel } = props;
    const zones = this.pdta.findPreset(presetId, bankId, key, vel);
    return zones;
  }
  stdout() {
    this.rend_ctx.output = cspawn(
      'ffplay -f f32le -i pipe:0 -ac 2 -ar 48000'
    ).stdin;
  }
  play(instrument: string, key = 44, vel = 66) {
    let found = 0;

    for (let idx = 0; idx < std_inst_names.length; idx++) {
      if (std_inst_names[idx].includes(instrument)) {
        console.log('playing ' + std_inst_names[idx]);
        found = 1;
        this.rend_ctx.programs[0] = { presetId: idx, bankId: 0 };
        break;
      }
    }
    this.rend_ctx.keyOn(key, vel, 0);
  }
  key(key: any, vel = 57) {
    this.rend_ctx.keyOn(key, vel, 0);
  }
}
const g = new SF2File('./file.sf2');
const ctx = g.rend_ctx;
ctx.keyOn(33, 55);
console.log(ctx.render(132));
console.log(ctx.render(132));
console.log(ctx.render(132));
console.log(ctx.render(132));
console.log(ctx.render(132));
console.log(ctx.render(132));
console.log(ctx.render(132));
console.log(ctx.render(132));
console.log(ctx.render(132));
console.log(ctx.render(132));
