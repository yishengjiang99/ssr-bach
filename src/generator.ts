import { sf_gen_id } from './sf.types.js';

export type GenRange = { lo: number; hi: number };
export class SFGenerator {
  from: number = 0;
  constructor(private _operator: sf_gen_id, private int16: number) {}
  add(modgen: SFGenerator) {
    this.int16 += modgen.int16;
  }
  get operator() {
    return this._operator;
  }
  get range(): GenRange {
    return { lo: this.int16 & 0x7f, hi: (this.int16 >> 8) & 0xff };
  }
  get u16() {
    return this.int16 & 0x0ff0; // | (this.hi << 8);
  }
  get s16() {
    return this.int16;
  }
  set s16(val) {
    this.int16 += val;
  }
}
