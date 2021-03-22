import * as sfTypes from './sf.types';
import assert from 'assert';
import { Shdr } from './pdta';
import { SF2File } from './sffile';
import { LUT } from './LUT';
import { SFZone } from './Zone';
import { centibel } from './centTone';
import { Envelope } from './envAmplitue';
export type Voice = {
  channel?: number;
  smpl: Shdr;
  zone?: SFZone;
  length?: number;
  ratio: number;
  iterator: number;
  gain?: (chanVol, masterVol) => number;
  pan?: { left?: number; right?: number };
  key?: number;
  envelope: any;
  envelopeIterator?: IterableIterator<number>;
};
/**
 * corresponds to MIDI
 * https://www.recordingblogs.com/wiki/midi-program-change-message
 */
type Program = {
  bankId: number;
  presetId: number;
};

export class RenderCtx {
  sampleRate: 48000 = 48000;
  voices: Voice[] = [];
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

  private _masterVol: number = 70;
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

  keyOn(key, vel = 79, channelId = 0) {
    const { presetId, bankId } = this.programs[channelId];
    const zones = this.sff.findPreset({
      bankId,
      presetId,
      key,
      vel,
    });
    console.log(zones);
    if (!zones || !zones.length) return;

    zones.forEach((zone, i) => {
      this.voices[channelId + 16 * i] = runtime(zone, {
        key: key,
        velocity: vel,
        sampleRate: this.sampleRate,
      });
    });

    return this.voices[channelId];
  }

  keyOff(channelId) {
    this.voices[channelId].envelope.triggerRelease();
  }
  _render(voice: Voice, outputArr: Buffer, blockLength) {
    const input: Buffer = this.sff.sdta.data;
    const looper = voice.smpl.endLoop - voice.smpl.startLoop;
    let shift = 0.0;
    let iterator = voice.iterator || voice.smpl.start;
    const channelGain = voice.gain(
      this.chanVols[voice.channel % 16],
      this.masterVol
    );
    // console.log(channel.smpl.startLoop, channel.smpl.endLoop);
    for (let offset = 0; offset < blockLength - 1; offset++) {
      assert(iterator >= voice.smpl.start && iterator <= voice.smpl.end);
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
      const gainvol = voice.envelopeIterator.next().value;
      let sum = currentVal + newVal * gainvol * channelGain;
      //(newVal * channel.gain) / n;
      if (sum > 0.9 || sum < -0.9) sum *= 0.8;
      outputArr.writeFloatLE(sum * voice.pan.left, outputByteOffset);
      outputArr.writeFloatLE(sum * voice.pan.right, outputByteOffset + 4);
      // if (offset % 200 == 42) {
      //   console.log(currentVal, newVal, input.readFloatLE(outputByteOffset));
      // }
      while (shift >= 1) {
        iterator++;
        shift--;
      }
      shift += voice.ratio;
      while (iterator >= voice.smpl.endLoop) {
        iterator -= looper;
      }
      if (iterator >= voice.smpl.end) {
        //  console.log('hit sample emd ,,,', channel.length);
        if (voice.length > 0) throw 'error with loop';
      }
    }
    voice.length -= blockLength;

    voice.iterator = iterator;
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

type RunTimeParams = {
  key: number;
  velocity: number;
  sampleRate: number;
  duration?: number;
  channelId?: number;
};

export function runtime(zone: SFZone, params: RunTimeParams): Voice {
  const { noteVelocity, key, sampleRate, channelId } = {
    ...params,
    ...{
      noteVelocity: 65,
      key: 60,
      sampleRate: 48000,
      channelId: 0,
    },
  };
  const {
    phases: { delay, attack, hold, decay, release },
    sustain,
  } = zone.volEnv;
  const ampEnv = Envelope(
    [delay, (attack * (144 - noteVelocity)) / 127, hold, decay, release],
    sustain,
    sampleRate
  );
  const pitchRatio =
    (Math.pow(2, (zone.pitch - key * 100) / 1200) * zone.sample.sampleRate) /
    sampleRate;
  return {
    channel: channelId,
    zone: zone,
    smpl: zone.sample,
    length:
      ampEnv.stages[0] + ampEnv.stages[1] + ampEnv.stages[2] + ampEnv.stages[3],
    ratio: pitchRatio,
    iterator: zone.sample.start,
    key: key,
    pan: {
      left: Math.sqrt(0.5 - zone.pan),
      right: Math.sqrt(0.5 + zone.pan),
    },
    envelope: ampEnv,
    envelopeIterator: ampEnv.genDBVals(),
    gain: function (chanVol, mastVol = 127) {
      const attentuation: centibel =
        zone.attenuate +
        LUT.midiCB[chanVol] +
        LUT.velCB[noteVelocity] +
        LUT.midiCB[mastVol];
      return LUT.cent2amp[attentuation];
    },
    //rt.gain,
  };
}
