import { parsePDTA } from "./pdta";

import { reader } from "./reader";
import { s16tof32 } from "./s16tof32";
import { Channel, FindPresetProps, generatorNames, generators, RIFFSFBK, Zone } from "./sf.types";
import assert from "assert";
import { compression, Envelope } from "ssr-cxt";

const defaultBlockLength = 128;

export class SF2File {
  sections: RIFFSFBK;
  channels: Channel[] = new Array(16);
  constructor(path: string) {
    const r = reader(path);
    let i = 0;

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
  findPreset({ bankId, presetId, key, vel }: FindPresetProps) {
    const sections = this.sections;
    const noteHave =
      !sections.pdta.data[bankId] ||
      !sections.pdta.data[bankId][presetId] ||
      !sections.pdta.data[bankId][presetId].zones;
    if (noteHave) {
      return null;
    }
    const presetZones = sections.pdta.data[bankId][presetId].zones;
    let candidate: Zone | null = null;
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
  keyOn({ bankId, presetId, key, vel }: FindPresetProps, duration: number, channelId: number) {
    const preset = this.findPreset({ bankId, presetId, key, vel });
    //if (channelId != 2) return;
    const length = ~~(duration * 48000);
    const [delay, a, hold, d, r, s] = preset.adsr;
    const envelope = new Envelope(48000, [a, d, s, r]);

    this.channels[channelId] = {
      smpl: preset.sample,
      length: length,
      ratio: (Math.pow(2, (key - preset.sample.originalPitch) / 12) * preset.sample.sampleRate) / 48000,
      iterator: preset.sample.start,
      lowPassFilter: lpf()
      envelope,
    };
    return this.channels[channelId];
  }

  _render(channel: Channel, outputArr: Buffer, blockLength = defaultBlockLength) {
    const input: Buffer = this.sections.sdta.data;
    const looper = channel.smpl.endLoop - channel.smpl.startLoop;
    const sample = channel.smpl;
    let shift = 0.0;
    let iterator = channel.iterator || channel.smpl.start;
    for (let offset = 0; offset < blockLength; offset++) {
      const outputByteOffset = offset * Float32Array.BYTES_PER_ELEMENT;
      const fade = channel.length > 0 ? 1 : 1 - (-1 * channel.length * channel.envelope.tau) / 48000; //note is releasing and fading
      const currentVal = outputArr.readFloatLE(outputByteOffset);

      const val = input.readInt16LE(iterator * Int16Array.BYTES_PER_ELEMENT) * fade;
      const valFloat = (val / 0x7fff) * channel.envelope.shift();

      const sum = compression(currentVal + valFloat, 0.6, 3, 0.8);

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

// const gg = new SF2File("file.sf2");
// let pz = gg.findPreset({ bankId: 0, presetId: 3, vel: 55, key: 44 });
// console.log(pz, pz.attributes);
// for (let vel = 30; vel < 55; vel++) {
//   pz = gg.findPreset({ bankId: 0, presetId: 3, vel: vel, key: 44 });
//   console.log(pz.attributes);
// }
