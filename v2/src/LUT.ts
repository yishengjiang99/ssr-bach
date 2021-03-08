export class LUT {
  static relPC: number[] = [];
  static frqST: number[] = [];
  static midiCB: number[] = [];
  static init() {
    for (let n = 0; n < 2400; n++) {
      LUT.relPC[n] = Math.pow(2.0, (n - 1200.0) / 1200.0);
    }
    for (let n = 0; n < 128; n++) {
      LUT.frqST[n] = 440 * Math.pow(2, (n - 69) / 12.0);
    }
    for (let n = 1; n < 128; n++) {
      LUT.midiCB[n] = (-20 / 96) * Math.log10((127 * 127) / (n * n));
    }
  }
}
