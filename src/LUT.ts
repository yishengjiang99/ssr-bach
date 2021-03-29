import { DecibelCent } from './sf.types';

export class LUT {
  static relPC: number[] = [];
  static frqST: number[] = [];
  static midiCB: number[] = [];
  static velCB: number[] = [];
  static cent2amp: number[] = [];
  static absTC: number[] = [];

  static init() {
    if (LUT.absTC.length > 0) return;
    for (let n = 0; n < 20000; n += 1)
      LUT.absTC[n] = Math.pow(2.0, (n - 12000.0) / 1200.0);

    LUT.cent2amp = [];
    for (let i = 0; i <= 960; i++) {
      LUT.cent2amp[i] = Math.pow(10, i / -200.0);
    }
    LUT.velCB = new Array(128);
    LUT.velCB[0] = 0.0;
    LUT.velCB[127] = 1.0;
    for (let i = 1; i < 127; i++) {
      LUT.velCB[i] = (-200.0 / 960) * Math.log((i * i) / (127 * 127));
    }
    for (let n = 0; n < 2400; n++) {
      LUT.relPC[n] = Math.pow(2.0, (n - 1200.0) / 1200.0);
    }
    for (let n = 0; n < 128; n++) {
      LUT.frqST[n] = 440 * Math.pow(2, (n - 69) / 12.0);
    }
    LUT.midiCB[0] = 0;
    LUT.midiCB[127] = 1.0;
    for (let n = 1; n < 128; n++) {
      LUT.midiCB[n] = -200.0 * Math.log((n / 127) * (n / 127));
    }
  }

  static centtime2sec(ct) {
    if (ct < -12000) return 0.001;
    if (ct > 8000) return 30;
    ct = ct + 12000;
    return LUT.absTC[~~ct];
  }

  static midi2cb(midi) {
    if (midi > 127 || midi < 0) throw 'out of range ';
    return LUT.midiCB[~~midi];
  }
  static getAmp(cb) {
    cb = ~~cb;
    if (cb <= 0) return 0;
    if (cb >= 960) cb = 960;
    return LUT.cent2amp[cb];
  }
}
LUT.init();
