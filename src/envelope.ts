import { LUT, dbfs } from './LUT.js';
import { ModEffects, centibel, stagesEnum } from './runtime';

export class Envelope {
  effects: ModEffects;
  state: {
    stage: number;
    stageStep: number;
  } = {
    stage: 0,
    stageStep: 0,
  };
  sr: number;
  stages: number[] = [];
  deltas: number[];
  keyOff = false;
  egval: number;
  modifier: number;
  amts: number[];
  releaseTimeout = 99999;

  constructor(phases: any, sustainCB: centibel, sampleRate = 48000) {
    if (phases[4]) {
      const [delay, attack, hold, decay, release] = phases;
      return new Envelope(
        { delay, attack, hold, decay, release },
        sustainCB,
        sampleRate
      );
    }
    const { delay, attack, hold, decay, release } = phases;
    this.stages = [delay, attack, hold, decay, release]
      .map((centime) => LUT.centtime2sec(centime) * sampleRate)
      .map((t) => Math.max(1, t));
    const normalizedSustain = 1 - sustainCB / 1000;
    this.amts = [0, 0, 1, 1, normalizedSustain, 0];
    this.deltas = [
      0,
      1 / this.stages[1],
      0,
      normalizedSustain / this.stages[3],
      -1 / this.stages[4],
      0,
    ];
    this.egval = 0;
  }

  get done() {
    return this.egval < -10 || this.state.stage == 5;
  }
  get val() {
    return this.egval;
  }
  shift(steps: number) {
    this.releaseTimeout -= steps;
    if (this.releaseTimeout <= 128) {
      this.triggerRelease();
    }
    const { stage, stageStep } = this.state;
    if (stage === 5) return 0;
    const stepsremining = this.stages[stage] - stageStep - steps;
    if (stepsremining < 0) {
      this.state.stage++;
      this.state.stageStep = -1 * stepsremining;
      this.egval =
        this.amts[this.state.stage] +
        this.deltas[this.state.stage] * this.state.stageStep;
    } else {
      this.state.stageStep += steps;
      this.egval += steps * this.deltas[this.state.stage];
    }
  }
  get ampCB() {
    return (1 - this.egval) * dbfs;
  }
  get gain() {
    return Math.pow(10, this.ampCB / -200.0);
  }
  get modCenTune() {
    return this.effects.pitch * this.egval;
  }
  get stage() {
    return this.state.stage;
  }
  *iterator() {
    if (this.done) return 0;
    else yield this.val;
  }
  triggerRelease(timeout = 0) {
    if (timeout && timeout > 0) this.releaseTimeout = timeout;
    else if (this.state.stage < stagesEnum.release) {
      this.state.stage = stagesEnum.release;
      this.state.stageStep = 0;
      this.stages[stagesEnum.release] =
        this.egval / this.deltas[stagesEnum.release];
    }
  }
}
