import { PDTA } from './pdta';
import { reader } from './reader';
import * as sfTypes from './sf.types';
import assert from 'assert';
import { RenderCtx } from './render-ctx';
import { SFZone } from './Zone';
import { bufferReader } from './readmidi';
import { sleep, std_inst_names } from './utilv1';
import { ffp } from './sinks';
import { loop } from './Utils';
import { cspawn } from './cspawn';
import { createWriteStream } from 'fs';

export class SF2File {
  pdta: PDTA;
  sdta: { nsamples: number; data: Float32Array; bit16s: Int16Array };
  rend_ctx: RenderCtx;
  path: string;
  static fromURL(url: string, cb) {
    fetch(url)
      .then((res) => res.arrayBuffer())
      .then((ab) => {
        const [riff, size, sfbk, list, skip, info] = new Uint32Array(ab, 0, 24);
      });
  }
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
        const bit16s = new Int16Array(r.readN(sectionSize - 4).buffer);
        const fll = new Float32Array(nsamples);
        for (let i = 0; i < nsamples; i++) {
          fll[i] = bit16s[i] / 0x7fff;
        }
        this.sdta = {
          nsamples: nsamples,
          data: fll,
          bit16s,
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
  key(key, vel = 57) {
    this.rend_ctx.keyOn(key, vel, 0);
  }
}
