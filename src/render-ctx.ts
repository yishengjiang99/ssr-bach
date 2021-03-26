import * as sfTypes from './sf.types';
import assert from 'assert';
import { Shdr } from './pdta';
import { SF2File } from './sffile';
import { LUT } from './LUT';
import { SFZone } from './Zone';
import { centibel } from './centTone';
import { Envelope, Runtime } from './runtime';

type Program = {
  bankId: number;
  presetId: number;
};
const log2of48000 = 18660; //Math.log2(48000) * 1200;
export class RenderCtx {
  sampleRate: number = 48000;
  voices: Runtime[] = [];
  outputCard: Buffer = Buffer.alloc(1024);
  programs: { presetId: number; bankId: number }[];
  constructor(private sff: SF2File) {
    LUT.init();
    this.programs = [
      { presetId: 0, bankId: 0 },
      { presetId: 0x08, bankId: 0 },
      { presetId: 0x10, bankId: 0 },
      { presetId: 0x18, bankId: 0 },
      { presetId: 0x20, bankId: 0 },
      { presetId: 0x28, bankId: 0 },
      { presetId: 0x30, bankId: 0 },
      { presetId: 0x38, bankId: 0 },
      { presetId: 0x40, bankId: 0 },
      { presetId: 0, bankId: 128 },
      { presetId: 0x50, bankId: 0 },
      { presetId: 0x60, bankId: 0 },
      { presetId: 0x70, bankId: 0 },
    ];
  }

  private _masterVol: number = 120;
  public get masterVol(): number {
    return this._masterVol;
  }
  public set masterVol(value: number) {
    this._masterVol = value;
  }
  /* db attentuate.. */
  private _chanVols: number[] = new Array(16).fill(70);
  public get chanVols(): number[] {
    return this._chanVols;
  }
  public set chanVols(value: number[]) {
    this._chanVols = value;
  }

  keyOn(key, vel, channelId = 0) {
    const { presetId, bankId } = this.programs[channelId];
    const zones = this.sff.findPreset({
      bankId,
      presetId,
      key,
      vel,
    });
    if (!zones || !zones.length) return;

    zones.forEach((zone, i) => {
      this.voices[channelId + 16 * i] = new Runtime(
        zone,
        {
          key: key,
          velocity: vel,
          channel: channelId,
        },
        this
      );
    });

    return this.voices[channelId];
  }

  keyOff(channelId) {
    this.voices[channelId]?.mods.ampVol.triggerRelease();
  }
  _render(voice: Runtime, outputArr: Buffer, blockLength) {
    const input: Buffer = this.sff.sdta.data;
    const looper = voice.sample.endLoop - voice.sample.startLoop;
    let shift = 0.0;
    let iterator = voice.iterator || voice.sample.start;

    const { volume, pitch, filter } = voice.run(blockLength);
    // console.log(channel.smpl.startLoop, channel.smpl.endLoop);
    for (let offset = 0; offset < blockLength; offset++) {
      const outputByteOffset = offset * Float32Array.BYTES_PER_ELEMENT * 2;
      let currentVal = outputArr.readFloatLE(outputByteOffset);
      if (isNaN(currentVal)) currentVal = 0.0;
      let newVal;
      if (offset > 4) {
        const [vm1, v0, v1, v2] = [-1, 0, 1, 2].map((i) =>
          input.readFloatLE((iterator + i) * 4)
        );
        newVal = hermite4(shift, vm1, v0, v1, v2);
      } else {
        newVal = input.readFloatLE(iterator * 4);
      }

      let sum = currentVal + newVal * volume;

      outputArr.writeFloatLE(
        sum * voice.staticLevels.pan.left,
        outputByteOffset
      );
      outputArr.writeFloatLE(
        sum * voice.staticLevels.pan.right,
        outputByteOffset + 4
      );
      if (offset % 200 == 42) {
        //console.log(currentVal, newVal, input.readFloatLE(outputByteOffset));
      }
      shift += pitch;

      while (shift >= 1) {
        iterator++;
        shift--;
      }

      if (iterator >= voice.sample.endLoop) {
        iterator -= looper;
      }
      if (iterator >= voice.sample.end) {
        //  console.log('hit sample emd ,,,', channel.length);
        // if (voice.length > 0) throw 'error with loop';
      }
    }

    voice.length -= blockLength;
    voice.iterator = iterator;
  }
  render = (blockSize) => {
    const output = Buffer.alloc(blockSize * 8);
    this.voices
      .filter((v) => v.length && v.length > 0)
      .map((voice) => {
        // console.log(
        //   voice.ratio,
        //   voice.length,
        //   voice.smpl.start,
        //   voice.smpl.startLoop,
        //   voice.smpl.end
        // );
        this._render(voice, output, blockSize);
      });
    return output;
  };
}
function hermite4(frac_pos, xm1, x0, x1, x2) {
  const c = (x1 - xm1) * 0.5;
  const v = x0 - x1;
  const w = c + v;
  const a = w + v + (x2 - x0) * 0.5;
  const b_neg = w + a;

  return ((a * frac_pos - b_neg) * frac_pos + c) * frac_pos + x0;
}
