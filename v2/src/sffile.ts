import { parsePDTA } from "./pdta";
import { reader } from "./reader";
import * as sfTypes from "./sf.types";
import assert from "assert";
import { LUT } from "./LUT";
import { envAmplitue } from "./envAmplitue";
const defaultBlockLength = 128;

export class SF2File {
  sections: sfTypes.RIFFSFBK;
  chanVols: number[] = new Array(16).fill(0);
  ccVol(c, v): void {
    this.chanVols[c] = v;
  }
  private _channels: sfTypes.Channel[] = new Array(16);
  private _lastPresetId: any;
  public get channels(): sfTypes.Channel[] {
    return this._channels;
  }
  public set channels(value: sfTypes.Channel[]) {
    this._channels = value;
  }
  private _sampleRate: number;
  public get sampleRate(): number {
    return this._sampleRate;
  }
  public set sampleRate(value: number) {
    this._sampleRate = value;
  }
  static fromBuffer(buffer: Buffer) {}
  constructor(path: string, sampleRate: number = 48000) {
    const r = reader(path);
    let i = 0;
    this.sampleRate = sampleRate;
    assert(r.read32String(), "RIFF");
    let size: number = r.get32();
    assert(r.read32String(), "sfbk");
    assert(r.read32String(), "LIST");
    size -= 64;
    const sections: any = {};
    do {
      const sectionSize = r.get32();
      const section = r.read32String();
      size = size - sectionSize;
      if (section === "pdta") {
        sections.pdta = {
          offset: r.getOffset(),
          ...parsePDTA(r),
        };
      } else if (section === "sdta") {
        assert(r.read32String(), "smpl");
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
  }
  findPreset({ bankId, presetId, key, vel }: sfTypes.FindPresetProps) {
    const sections = this.sections;
    const noteHave =
      !sections.pdta.presets[bankId + ""] ||
      !sections.pdta.presets[bankId][presetId] ||
      !sections.pdta.presets[bankId][presetId].zones;
    if (noteHave) {
      console.log("no", bankId, presetId, key, vel);
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
    return null;
  }

  keyOn(
    { bankId, presetId, key, vel }: sfTypes.FindPresetProps,
    duration: number,
    channelId: number
  ) {
    const preset = this.findPreset({ bankId, presetId, key, vel });
    const length = ~~(duration * this.sampleRate);

    const centiDB =
      preset.attenuation + LUT.velCB[this.chanVols[channelId]] + LUT.velCB[vel];

    this.channels[channelId] = {
      id: channelId,
      zone: preset,
      smpl: preset.sample,
      length: length,
      ratio: preset.pitchAjust(key, this.sampleRate),
      iterator: preset.sample.start,
      ztransform: (x) => x,
      gain: LUT.cent2amp[~~centiDB], //static portion of gain.. this x envelope=ocverall gain
      pan: preset.pan,
      envelopeIterator: null, //, sustain, sr) preset.envAmplitue(this.sampleRate),
    };
    return this.channels[channelId];
  }
  key(key: number, duration = 0.25, presetId = null) {
    if (presetId) this._lastPresetId = presetId;
    let channelId = 0;
    while (this.channels[channelId] && this.channels[channelId++].length > 10);

    return this.keyOn(
      { key, bankId: 0, vel: 60, presetId: this._lastPresetId || 0 },
      duration,
      channelId
    );
  }
  _render(channel: sfTypes.Channel, outputArr: Buffer, blockLength, n) {
    const input: Buffer = this.sections.sdta.data;
    const looper = channel.smpl.endLoop - channel.smpl.startLoop;
    const sample = channel.smpl;
    let shift = 0.0;
    let iterator = channel.iterator || channel.smpl.start;
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
      let sum = currentVal + (newVal * channel.gain) / n;
      outputArr.writeFloatLE(sum * 0.98, outputByteOffset);
      outputArr.writeFloatLE(sum * 1.03, outputByteOffset + 4);

      shift += channel.ratio;
      while (shift >= 1) {
        iterator++;
        shift--;
      }
      if (channel.length > 0 && iterator >= sample.endLoop) {
        iterator -= looper;
      }
      if (iterator >= sample.end) return 0;
      channel.length--;
    }
    channel.iterator = iterator;
  }

  render(blockSize) {
    const output = Buffer.alloc(blockSize * 4 * 2);
    this.channels = this.channels.filter((c) => c && c.length > 0);
    this.channels.map((c, i) => {
      this._render(c, output, blockSize, this.channels.length);
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
