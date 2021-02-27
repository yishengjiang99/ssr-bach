import { parsePDTA } from "./pdta";

import { reader } from "./reader";
import { s16tof32 } from "./s16tof32";
import { Channel, FindPresetProps, generatorNames, generators, RIFFSFBK, Zone } from "./sf.types";
import assert from "assert";
import { ffp } from "./ffp";
import { createWriteStream } from "fs";

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
      const diff = vel - z.velRange.lo;
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
    this.channels[channelId] = {
      smpl: preset.sample,
      length: length,
      ratio: (Math.pow(2, ((key - preset.sample.originalPitch) * 1000) / 12000) * preset.sample.sampleRate) / 48000,
      iterator: preset.sample.start,
    };
  }

  _render(channel: Channel, outputArr: Buffer, blockLength = defaultBlockLength) {
    const input: Buffer = this.sections.sdta.data;
    const looper = channel.smpl.endLoop - channel.smpl.startLoop;
    const sample = channel.smpl;
    let shift = 0.0;
    let iterator = channel.iterator || channel.smpl.start;
    for (let offset = 0; offset < blockLength; offset++) {
      const outputByteOffset = offset * Float32Array.BYTES_PER_ELEMENT;
      const fade = channel.length > 0 ? 1 : 1 / (1 + channel.length);

      const val = input.readInt16LE(iterator * Int16Array.BYTES_PER_ELEMENT) * fade;
      let valFloat = val / 0x7fff;
      if (valFloat > 0.9) valFloat = 0.9 + (valFloat - 0.9) / 5;
      if (valFloat > 0.9999) valFloat = 0.9999;

      const currentVal = outputArr.readFloatLE(outputByteOffset);
      outputArr.writeFloatLE(currentVal + valFloat, outputByteOffset);
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
    console.log(this.channels.length);
    return output;
  }
}

const gg = new SF2File("file.sf2");
let pz = gg.findPreset({ bankId: 0, presetId: 3, vel: 55, key: 44 });
console.log(pz, pz.attributes);
for (let vel = 30; vel < 55; vel++) {
  pz = gg.findPreset({ bankId: 0, presetId: 3, vel: vel, key: 44 });
  console.log(pz.attributes);
}
