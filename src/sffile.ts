import { parsePDTA } from './pdta';
import { reader } from './reader';
import * as sfTypes from './sf.types';
import assert from 'assert';
import { RenderCtx } from './render-ctx';
import { Zone } from './PresetZone';

export class SF2File {
  sections: sfTypes.RIFFSFBK;
  renderCtx: RenderCtx;
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
        sections.pdta = {
          offset: r.getOffset(),
          ...parsePDTA(r),
        };
      } else if (section === 'sdta') {
        assert(r.read32String(), 'smpl');
        const nsamples = (sectionSize - 4) / 2;
        const floatBuffer = Buffer.allocUnsafe(nsamples * 4);
        const bit16s = r.readN(sectionSize - 4);
        for (let i = 0; i < nsamples; i++)
          floatBuffer.writeFloatLE(bit16s.readInt16LE(i * 2) / 0x7fff, i * 4);
        sections.sdta = {
          offset: r.getOffset(),
          data: floatBuffer,
          sectionSize,
        };
      } else {
        r.skip(sectionSize);
      }
    } while (size > 0);
    this.sections = sections;
    this.renderCtx = new RenderCtx(this);
  }
  get tones() {
    return this.sections.pdta.presets[0];
  }
  get drums() {
    return this.sections.pdta.presets[128];
  }
  findPreset({ bankId, presetId, key, vel }: sfTypes.FindPresetProps): Zone {
    const bank = bankId > 0 ? this.tones : this.drums;
    const presetZones = bank[presetId].zones;
    for (const z of presetZones) {
      if (!z.sample) continue;
      if (z.velRange.lo > vel || z.velRange.hi < vel) continue;
      if (z.keyRange.lo > key || z.keyRange.hi < key) continue;
      return z;
    }
    return null;
  }
}
