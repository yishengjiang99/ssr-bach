import { parsePDTA } from "./pdta";
import { reader } from "./reader";
import * as sfTypes from "./sf.types";
import assert from "assert";
import { Envelope } from "./envelope";
import { clamp } from "./utils";

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
    if (this.channels[channelId] && this.channels[channelId].length > 0) {
      //   return false;
    }
    const [a, d, s, r] = preset.adsr;
    const envelope = new Envelope(this.sampleRate, [
      a,
      d, // + 0.000000901,
      s,
      r,
    ]); //laplacian smoothing(sic)
    const length = ~~(duration * this.sampleRate);
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
      pan: null,
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
  _render(channel: sfTypes.Channel, outputArr: Buffer, blockLength, activechans) {
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
      const [, v0, v1] = [-1, 0, 1, 2].map((i) => input.readFloatLE((iterator + i) * 4));
      //spline lerp found on internet
      newVal = shift == 0 ? v0 : v0 + shift * (v1 - v0);
      //if (_lpf) newVal = _lpf.filter(newVal);
      const amp = channel.gain * channel.envelope.shift();
      //
      //basically this whole project was motivated to somehow minimize the deconomulator of second term h
      // ie. as little attenuation as possible
      let sum = currentVal + (newVal * amp) / activechans; //(channel.envelope.attaching() ? 1 : Math.min(activechans, 4));
      // sum = compression(sum, 0.5, 3, 0.9);
      outputArr.writeFloatLE(clamp(sum, -1, 1) * 0.98, outputByteOffset);
      outputArr.writeFloatLE(clamp(sum, -1, 1) * 1.03, outputByteOffset + 4);

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
    //    new Float32Array(blockSize).fill(0);
    const output = Buffer.from(new Float32Array(blockSize * 4 * 2).fill(0)); //.fill(0);
    this.channels = this.channels.filter((c) => c);
    const activechans = this.channels.filter(
      (c) => c.envelope.attaching() || c.envelope.holding()
    );

    this.channels.map((c) => {
      this._render(c, output, blockSize, activechans);
    });
    return output;
  }
}
