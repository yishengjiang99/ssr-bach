import * as sfTypes from './sf.types';
import assert from 'assert';
import { Shdr } from './pdta';
import { Zone } from './PresetZone';
import { SF2File } from './sffile';
import { LUT } from './LUT';
export type Voice = {
  channel: number;
  smpl: Shdr;
  zone?: Zone;
  length: number;
  ratio: number;
  iterator: number;
  gain?: number;
  pan?: number;
  key?: number;
  envelopeIterator?: IterableIterator<number>;
};
export class RenderCtx {
  voices: Voice[];
  constructor(private sff: SF2File) {
    LUT.init();
  }
  masterVol: number;
  chanVols: number[] = new Array(16).fill(0);
  ccVol(c, v): void {
    this.chanVols[c] = v;
  }

  sampleRate: 48000 = 48000;

  keyOn(
    { bankId, presetId, key, vel }: sfTypes.FindPresetProps,
    duration: number,
    channelId: number
  ): Voice {
    const zone = this.sff.findPreset({
      bankId,
      presetId,
      key,
      vel,
    });
    this.voices[channelId] = {
      channel: channelId,
      zone: zone,
      smpl: zone.sample,
      length: ~~(duration * this.sampleRate),
      ratio: zone.pitchAdjust(key),
      iterator: zone.sample.start,
      key: key,
      gain: zone.gain(vel, this.chanVols[channelId], this.masterVol),
    };
    return this.voices[channelId];
  }

  _render(channel: sfTypes.Channel, outputArr: Buffer, blockLength) {
    const input: Buffer = this.sff.sections.sdta.data;
    const looper = channel.smpl.endLoop - channel.smpl.startLoop;
    let shift = 0.0;
    let iterator = channel.iterator || channel.smpl.start;
    let eg = channel.envelopeIterator.next();
    const gainVol = LUT.cent2amp[~~eg];

    for (let offset = 0; offset < blockLength - 1; offset++) {
      assert(iterator >= channel.smpl.start && iterator <= channel.smpl.end);
      const outputByteOffset = offset * Float32Array.BYTES_PER_ELEMENT * 2;
      const currentVal = outputArr.readFloatLE(outputByteOffset);

      let newVal;
      const [vm1, v0, v1, v2] = [-1, 0, 1, 2].map((i) =>
        input.readFloatLE((iterator + i) * 4)
      );
      //spline lerp found on internet
      newVal = hermite4(shift, vm1, v0, v1, v2);
      //   const envval = channel.envelopeIterator.next();
      let sum = currentVal + newVal; //(newVal * channel.gain) / n;
      outputArr.writeFloatLE(sum * 0.98, outputByteOffset);
      outputArr.writeFloatLE(sum * 1.03, outputByteOffset + 4);

      while (shift >= 1) {
        iterator++;
        shift--;
      }
      if (channel.length > 0 && iterator >= channel.smpl.endLoop) {
        iterator -= looper;
      }
      if (iterator >= channel.smpl.end) return 0;
      channel.length--;
    }
    channel.iterator = iterator;
  }

  render(blockSize) {
    const output = Buffer.alloc(blockSize * 4 * 2);
    this.voices
      .filter((c) => c && c.length > 0)
      .map((c) => {
        this._render(c, output, blockSize);
      });
    for (let i = 0; i < 1000; i++) console.log(output.readFloatLE(100) + '\n');
    return output;
  }
}
function hermite4(frac_pos, xm1, x0, x1, x2) {
  const c = (x1 - xm1) * 0.5;
  const v = x0 - x1;
  const w = c + v;
  const a = w + v + (x2 - x0) * 0.5;
  const b_neg = w + a;

  return ((a * frac_pos - b_neg) * frac_pos + c) * frac_pos + x0;
}
