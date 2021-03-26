import { sf_gen_id } from './sf.types';
const {
  keyRange,
  velRange,
  delayModEnv,
  attackModEnv,
  holdModEnv,
  decayModEnv,
  releaseModEnv,
  delayVolEnv,
  attackVolEnv,
  holdVolEnv,
  decayVolEnv,
  sustainVolEnv,
  releaseVolEnv,
} = sf_gen_id;
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
  static defaultValue(operator: sf_gen_id) {
    switch (operator) {
      case delayVolEnv:
        return -12000;
      case attackVolEnv:
        return -12000;
      case holdVolEnv:
        return -12000;
      case decayVolEnv:
        return -12000;
      case releaseVolEnv:
        return -12000;
      case sustainVolEnv:
        return 250;
      case delayModEnv:
        return -12000;
      case attackModEnv:
        return -12000;
      case holdModEnv:
        return -12000;
      case decayModEnv:
        return -12000;
      case releaseModEnv:
        return -12000;

      default:
        return 0;
    }
  }
}
