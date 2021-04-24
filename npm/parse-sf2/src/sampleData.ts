import { SFZone, Shdr, SF2File } from './index.js';
//@ts-ignore
import { lerp } from '../node_modules/lerp/lerp.js';
export class SampleData {
  uint8s: Uint8Array;
  floatArr: SharedArrayBuffer;

  constructor(rawData: Uint8Array) {
    this.uint8s = rawData;
    this.floatArr = new SharedArrayBuffer(rawData.byteLength * 2);
    const dv2 = new DataView(this.floatArr);
    const dv = new DataView(this.uint8s.buffer);
    for (let i = 0; i < dv.byteLength / 2 - 1; i++) {
      dv2.setFloat32(i * 4, dv.getInt16(2 * i, true) / 0x7fff, true);
    }
  }

  sampleBuffer(zone: SFZone, pitchRatio = 1, length = 48000 * 3) {
    const { start, end, startLoop, endLoop } = zone.sample;
    const data = new Float32Array(this.floatArr);
    const loop = [
      zone.sample.startLoop - zone.sample.start,
      zone.sample.endLoop - zone.sample.start,
    ];

    function* shift() {
      let pos = 0x00;
      let n = 0;
      let shift = 0.0;
      while (n++ < length) {
        //@ts-ignore
        yield lerp(data[pos], data[pos + 1], shift);
        shift = shift + pitchRatio;
        while (shift >= 1) {
          shift--;
          pos++;
        }
        if (pos >= loop[1]) pos = loop[0];
        yield data[pos];
      }
      return data[pos];
    }
    return shift();
  }
}
