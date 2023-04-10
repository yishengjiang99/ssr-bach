import {
  cent2hz,
  centTone,
  ModEffects,
  timecent2nsamples,
} from './runtime.types';

export class LFO {
  sampleRate: number = 48000;
  amount: number = 0;
  delta: number;
  delay: number;
  cycles: number = 0;
  effects: ModEffects;
  constructor(
    delay: number,
    freq: centTone,
    effects: ModEffects,
    sampleRate: number = 48000
  ) {
    this.sampleRate = sampleRate;
    this.delta = (4.0 * cent2hz(freq)) / sampleRate; //covering distance of 1/4 4 times per cycle..
    this.delay = timecent2nsamples(delay);
    this.effects = effects;
  }
  static fromJSON(str: string) {
    const obj = JSON.parse(str);
    return new LFO(obj.delay, obj.freq, obj.effects);
  }
  shift(steps: number = 1) {
    while (steps-- > 0) {
      if (this.delay-- > 0) continue;
      this.amount += this.delta;
      if (this.amount >= 1 || this.amount <= -1) {
        this.delta = -1 * this.delta;
        this.cycles++;
      }
    }
    return this.amount;
  }

  get val() {
    return this.amount;
  }
}