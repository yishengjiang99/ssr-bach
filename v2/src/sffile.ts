import { parsePDTA } from "./pdta";
import { reader } from "./reader";
import * as sfTypes from "./sf.types";
import assert from "assert";
import { compression, Envelope } from "ssr-cxt";
import { clamp } from "./utils";
import { Note } from "@tonejs/midi/dist/Note";
const defaultBlockLength = 128;

export class SF2File {
  sections: sfTypes.RIFFSFBK;
  chanVols: number[] = new Array(16).fill(1);
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
          data: parsePDTA(r),
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
      !sections.pdta.data[bankId] ||
      !sections.pdta.data[bankId][presetId] ||
      !sections.pdta.data[bankId][presetId].zones;
    if (noteHave) {
      return null;
    }
    const presetZones = sections.pdta.data[bankId][presetId].zones;
    let candidate: sfTypes.Zone | null = null;
    let aggreDiff: number = 128 + 128;
    for (const z of presetZones) {
      if (z.velRange.lo > vel || z.velRange.hi < vel) continue;
      if (z.keyRange.lo > key || z.keyRange.hi < key) continue;

      const diff =
        vel -
        z.velRange.lo +
        (z.sample.originalPitch > key ? 5 : 0) +
        (z.sample.originalPitch - key) * 3;
      candidate = candidate || z;
      aggreDiff = aggreDiff || diff;
      if (diff < aggreDiff) {
        candidate = z;
        aggreDiff = diff;
      }
    }
    return candidate;
  }

  keyOn(
    { bankId, presetId, key, vel }: sfTypes.FindPresetProps,
    duration: number,
    channelId: number
  ) {
    const preset = this.findPreset({ bankId, presetId, key, vel });
    //if (channelId != 2) return;
    if (this.channels[channelId] && this.channels[channelId].length) {
      console.log(this.channels[channelId].length, "left--", channelId);
      //   return false;
    }
    const [a, d, s, r] = preset.adsr;
    const envelope = new Envelope(this.sampleRate, [
      a + 0.000000001,
      d + 0.0000001,
      s,
      r,
    ]); //laplacian smoothing(sic)
    const length = ~~(duration * this.sampleRate);
    const gdb = -1;
    this.channels[channelId] = {
      state: sfTypes.ch_state.attack,
      zone: preset,
      smpl: preset.sample,
      length: length,
      ratio:
        (Math.pow(2, (key - preset.sample.originalPitch) / 12) *
          preset.sample.sampleRate) /
        this.sampleRate,
      iterator: preset.sample.start,
      ztransform: (x) => x,
      envelope,
      gain: (this.chanVols[channelId] * ((preset.attenuation / 100) * 127)) / vel, // (Math.pow(10, -0.05 * preset.attenuation) / 127) * vel,
      pan: preset.attributes[sfTypes.generators.pan],
    }; //(float)(20.0 * TSF_LOG10(gain))
    // console.log(
    //   "\n",
    //   preset.attenuation,
    //   "\n",
    //   preset.attenuation - 20 * Math.log10(127 / vel)
    // );
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
    const t0 = process.hrtime();
    const input: Buffer = this.sections.sdta.data;
    //POWF(10.0f, db * 0.05f) : 0); //(1.0f / vel);
    const looper = channel.smpl.endLoop - channel.smpl.startLoop;
    const sample = channel.smpl;
    let shift = 0.0;
    let iterator = channel.iterator || channel.smpl.start;
    for (let offset = 0; offset < blockLength - 1; offset++) {
      assert(iterator >= channel.smpl.start && iterator <= channel.smpl.end);
      const outputByteOffset = offset * Float32Array.BYTES_PER_ELEMENT * 2;
      const currentVal = outputArr.readFloatLE(outputByteOffset);
      let newVal;
      if (offset === 0 || shift < 0.005) {
        newVal = input.readFloatLE(iterator * 4);
      } else {
        const [vm1, v0, v1, v2] = [-1, 0, 1, 2].map((i) =>
          input.readFloatLE((iterator + i) * 4)
        );
        //spline lerp found on internet
        newVal = v0 + shift * (v1 - v0); // hermite4(shift, vm1, v0, v1, v2);
      }
      //if (_lpf) newVal = _lpf.filter(newVal);
      const amp = channel.gain * channel.envelope.shift();
      //  console.log("amp", amp, channel.envelope.shift());
      let sum = currentVal + newVal * amp;
      // sum = compression(sum, 0.5, 3, 0.9);
      outputArr.writeFloatLE(clamp(sum, -1, 1) * 0.97, outputByteOffset);
      outputArr.writeFloatLE(clamp(sum, -1, 1) * 1.03, outputByteOffset + 4);

      shift += channel.ratio;
      while (shift >= 1) {
        iterator++;
        shift--;
      }
      if (iterator >= sample.endLoop) {
        iterator -= looper;
      }
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
