import { SF2File } from './sffile';
import { LUT } from './LUT';
import { Runtime } from './runtime';
import { Writable } from 'node:stream';
import { loop } from './Utils';

export class RenderCtx {
  sampleRate: number = 48000;
  voices: Runtime[] = [];
  outputCard = new Float32Array(256);
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

  public keyOn(key, vel, channelId = 0) {
    console.log(key, 'k');
    const { presetId, bankId } = this.programs[channelId];
    const zones = this.sff.findPreset({
      bankId,
      presetId,
      key,
      vel,
    });
    if (!zones || !zones.length) return;
    this.voices[channelId] = new Runtime(
      zones[0],
      {
        note: key,
        velocity: vel,
        channel: channelId,
      },
      this
    );
    console.log(key);
    return this.voices[channelId];
  }

  public keyOff(channelId) {
    this.voices[channelId]?.mods.ampVol.triggerRelease();
  }
  _render(voice: Runtime, outputArr: Float32Array, blockLength) {
    const input: Float32Array = this.sff.sdta.data;
    const looper = voice.sample.endLoop - voice.sample.startLoop;
    let shift = 0.0;
    let iterator = voice.iterator || voice.sample.start;

    const { volume, pitch, filter } = voice.run(blockLength);

    for (let offset = 0; offset < blockLength; offset++) {
      let newVal;
      if (offset > 1) {
        const [vm1, v0, v1, v2] = [-1, 0, 1, 2].map((i) => input[iterator + i]);
        newVal = hermite4(shift, vm1, v0, v1, v2);
      } else {
        newVal = input[iterator];
      }

      outputArr[offset * 2] += newVal;
      outputArr[offset * 2 + 1] += newVal;

      if (process.env.debug) {
        console.log(
          offset,
          `\n iter: ${iterator}`,
          `\n modvols:v${volume}\np:${pitch}\n`,
          newVal,
          newVal
        );
      }
      shift += pitch;

      while (shift >= 1) {
        iterator++;
        shift--;
      }

      if (iterator >= voice.sample.endLoop) {
        iterator -= looper;
      }
    }

    voice.length -= blockLength;
    voice.iterator = iterator;
  }
  output: Writable;
  render(length): Uint8Array {
    const outputArr = new Float32Array(length * 2);
    this.voices
      .filter((v) => v.length && v.length > 0)
      .forEach((voice) => {
        this._render(voice, outputArr, length);
      });
    if (this.output) this.output.write(new Uint8Array(outputArr.buffer));
    return new Uint8Array(outputArr.buffer);
  }
}
export function hermite4(frac_pos, xm1, x0, x1, x2) {
  const c = (x1 - xm1) * 0.5;
  const v = x0 - x1;
  const w = c + v;
  const a = w + v + (x2 - x0) * 0.5;
  const b_neg = w + a;

  return ((a * frac_pos - b_neg) * frac_pos + c) * frac_pos + x0;
}
