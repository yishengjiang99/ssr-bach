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
  pan?: { left?: number; right?: number };
  key?: number;
  envelopeIterator?: IterableIterator<number>;
};
export class RenderCtx {
  voices: Voice[] = [];
  outputCard: Buffer = Buffer.alloc(1024);
  constructor(private sff: SF2File) {
    LUT.init();
  }
  masterVol: number;

  /* db attentuate.. */
  private _chanVols: number[] = new Array(16).fill(0);
  public get chanVols(): number[] {
    return this._chanVols;
  }
  public set chanVols(value: number[]) {
    this._chanVols = value;
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
    if (!zone) return;
    this.voices[channelId] = {
      channel: channelId,
      zone: zone,
      smpl: zone.sample,
      length: ~~(duration * this.sampleRate),
      ratio: zone.pitchAdjust(key),
      iterator: zone.sample.start,
      key: key,
      pan: {
        left: Math.sqrt(0.5 - zone.pan),
        right: Math.sqrt(0.5 + zone.pan),
      },
      envelopeIterator: zone.envelope(this.sampleRate, vel),
      gain: zone.gain(vel, this.chanVols[channelId], this.masterVol),
    };
    return this.voices[channelId];
  }

  _render(channel: Voice, outputArr: Buffer, blockLength) {
    const input: Buffer = this.sff.sections.sdta.data;
    const looper = channel.smpl.endLoop - channel.smpl.startLoop;
    let shift = 0.0;
    let iterator = channel.iterator || channel.smpl.start;
    console.log(channel.smpl.startLoop, channel.smpl.endLoop);
    for (let offset = 0; offset < blockLength - 1; offset++) {
      assert(iterator >= channel.smpl.start && iterator <= channel.smpl.end);
      const outputByteOffset = offset * Float32Array.BYTES_PER_ELEMENT * 2;
      let currentVal = outputArr.readFloatLE(outputByteOffset);
      if (isNaN(currentVal)) currentVal = 0.0;
      let newVal;
      if (iterator > 8) {
        const [vm1, v0, v1, v2] = [-1, 0, 1, 2].map((i) =>
          input.readFloatLE((iterator + i) * 4)
        );
        newVal = hermite4(shift, vm1, v0, v1, v2);
      } else {
        newVal = input.readFloatLE(iterator) * 4;
      }

      //spline lerp found on internet
      //   const envval = channel.envelopeIterator.next();
      const gainvol = LUT.cent2amp[~~channel.envelopeIterator.next().value];
      let sum = currentVal + newVal * gainvol * channel.gain;
      //(newVal * channel.gain) / n;
      if (sum > 0.9 || sum < -0.9) sum *= 0.8;
      outputArr.writeFloatLE(sum * channel.pan.left, outputByteOffset);
      outputArr.writeFloatLE(sum * channel.pan.right, outputByteOffset + 4);
      // if (offset % 200 == 42) {
      //   console.log(currentVal, newVal, input.readFloatLE(outputByteOffset));
      // }
      while (shift >= 1) {
        iterator++;
        shift--;
      }
      shift += channel.ratio;
      while (iterator >= channel.smpl.endLoop) {
        iterator -= looper;
      }
      if (iterator >= channel.smpl.end) {
        //  console.log('hit sample emd ,,,', channel.length);
        if (channel.length > 0) throw 'error with loop';
      }
    }
    channel.length -= blockLength;

    channel.iterator = iterator;
  }
  render(blockSize) {
    const output = Buffer.alloc(blockSize * 8);
    this.voices.map((c) => {
      this._render(c, output, blockSize);
    });
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
