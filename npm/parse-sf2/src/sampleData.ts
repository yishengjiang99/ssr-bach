import { SF2File } from './sffile.js';
import { Shdr } from './sf.types.js';
export class SampleData {
  shdr: Shdr;
  uint8s: Uint8Array;
  get f32leArr(): Float32Array {
    this.uint8s;
    const floats = new Float32Array(this.uint8s.length / 2 - 1);
    const dv = new DataView(this.uint8s);
    for (let i = 0; i < dv.byteLength / 2 - 1; i++) {
      floats[2 * i] = dv.getInt16(2 * i, true) / 0x7fff; // / 0x7fff;
    }
    return floats;
  }
  loop: number[];
  constructor(shdr: Shdr, sffile: SF2File) {
    this.shdr = shdr;
    const { start, end } = shdr;
    this.uint8s = sffile.sdta.data.slice(start * 2, end * 2);
    this.loop = [
      this.shdr.startLoop - shdr.start,
      this.shdr.endLoop - shdr.start,
    ];
  }
  get audioBuffer() {
    const obd = new AudioBuffer({
      numberOfChannels: 1,
      sampleRate: this.shdr.sampleRate,
      length: this.f32leArr.length,
    });
    obd.copyToChannel(this.f32leArr, 0);
    return obd;
  }
}
