import { parsePDTA } from './pdta';
import { reader } from './reader';
import * as sfTypes from './sf.types';
import assert from 'assert';
import { RenderCtx } from './render-ctx';

export class SF2File {
  sections: sfTypes.RIFFSFBK;
  chanVols: number[] = new Array(16).fill(0);
  rend_ctx: RenderCtx;
  static fromBuffer() {}
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
    this.rend_ctx = new RenderCtx(this);
  }
  findPreset({ bankId, presetId, key, vel }: sfTypes.FindPresetProps) {
    const sections = this.sections;
    const noteHave =
      !sections.pdta.presets[bankId] ||
      !sections.pdta.presets[bankId][presetId] ||
      !sections.pdta.presets[bankId][presetId].zones;
    if (noteHave) {
      console.log('no', bankId, presetId, key, vel);
      return null;
    }
    const presetZones = sections.pdta.presets[bankId][presetId].zones;
    for (const z of presetZones) {
      if (!z.sample) continue;
      if (z.velRange.lo > vel || z.velRange.hi < vel) continue;
      if (z.keyRange.lo > key || z.keyRange.hi < key) continue;
      if (z.velRange.hi - z.velRange.lo > 77) continue;
      return z;
    }
    for (const z of presetZones) {
      if (!z.sample) continue;
      if (z.velRange.lo > vel || z.velRange.hi < vel) continue;
      if (z.keyRange.lo > key || z.keyRange.hi < key) continue;
      return z;
    }
    console.log(presetId, bankId, 'not found');
    return null;
  }
}
