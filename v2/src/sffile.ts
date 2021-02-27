import { parsePDTA } from "./pdta";
import { reader } from "./reader";
import * as sfTypes from "./sf.types";
import assert from "assert";
import { compression, Envelope } from "ssr-cxt";

const defaultBlockLength = 128;

export class SF2File {
  sections: sfTypes.RIFFSFBK;
  channels: sfTypes.Channel[] = new Array(16);
  sampleRate: number;
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
        sections.sdta = {
          offset: r.getOffset(),
          data: r.readN(sectionSize),
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

      const diff = vel - z.velRange.lo + (z.sample.originalPitch > key ? 30 : 0) + (z.sample.originalPitch - key) * 10;
      candidate = candidate || z;
      aggreDiff = aggreDiff || diff;
      if (diff < aggreDiff) {
        candidate = z;
        aggreDiff = diff;
      }
    }
    return candidate;
  }
  keyOn({ bankId, presetId, key, vel }: sfTypes.FindPresetProps, duration: number, channelId: number) {
    const preset = this.findPreset({ bankId, presetId, key, vel });
    //if (channelId != 2) return;
    const length = ~~(duration * this.sampleRate);
    const [delay, a, hold, d, r, s] = preset.adsr;
    const envelope = new Envelope(this.sampleRate, [a + 0.000001, d + 0.00001, s, r]); //laplacian smoothing(sic)

    this.channels[channelId] = {
      smpl: preset.sample,
      length: length,
      ratio: (Math.pow(2, (key - preset.sample.originalPitch) / 12) * preset.sample.sampleRate) / this.sampleRate,
      iterator: preset.sample.start,
      ztransform: (x) => x,
      envelope,
    };
    return this.channels[channelId];
  }

  _render(channel: sfTypes.Channel, outputArr: Buffer, blockLength = defaultBlockLength) {
    const input: Buffer = this.sections.sdta.data;
    const looper = channel.smpl.endLoop - channel.smpl.startLoop;
    const sample = channel.smpl;
    let shift = 0.0;
    let iterator = channel.iterator || channel.smpl.start;
    for (let offset = 0; offset < blockLength; offset++) {
      const outputByteOffset = offset * Float32Array.BYTES_PER_ELEMENT;
      const fade = channel.length > 0 ? 1 : 1 - (-1 * channel.length * channel.envelope.tau) / this.sampleRate; //note is releasing and fading
      const currentVal = outputArr.readFloatLE(outputByteOffset);
      const [vm1, v0, v1, v2] = [-1, 0, 1, 2].map((i) => input.readInt16LE((iterator + i) * 2)).map((d) => d / 0x7fff);
      const val = hermite4(shift, vm1, v0, v1, v2) * channel.envelope.shift();

      const sum = compression(currentVal + val, 0.8, 3, 0.9);

      outputArr.writeFloatLE(sum, outputByteOffset);
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
    const output = Buffer.alloc(blockSize * 4);
    this.channels = this.channels.filter((c) => c && c.length > 0);
    this.channels.map((c) => {
      this._render(c, output, blockSize);
      c.length -= blockSize;
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
