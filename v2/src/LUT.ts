export class LUT {
  static relPC: number[] = [];
  static frqST: number[] = [];
  static midiCB: number[] = [];
  static velCB: number[] = [];
  static cent2amp: number[] = [];

  static init() {
    LUT.cent2amp = [];
    for (let i = 0; i < 1441; i++) {
      LUT.cent2amp[i] = Math.pow(10, i / -200.0);
    }
    LUT.velCB = new Array(128);
    LUT.velCB[0] = 0.0;
    LUT.velCB[127] = 1.0;
    for (let i = 1; i < 127; i++) {
      LUT.velCB[i] = ((-200.0 / 960) * Math.log((i * i) / (127 * 127))) / Math.log(10);
    }
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
LUT.init();
