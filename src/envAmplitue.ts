import { LUT } from './LUT';
import { centibel, dbfs, ModEffects, stagesEnum } from './runtime.types';
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
  keyOff: boolean = false;
  egval: number;
  modifier: number;
  constructor(phases: any, sustainCB: centibel, sampleRate: number = 48000) {
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
    const normalizedSustain = -sustainCB / dbfs;
    const amts = [0, 0, 1, 1, normalizedSustain, 0];
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
    return this.egval < -10 || this.state.stage == stagesEnum.done;
  }
  get val() {
    return this.egval;
  }
  shift(steps: number) {
    if (this.state.stage === stagesEnum.done) return 0;
    while (steps > 0) {
      this.state.stageStep++;
      steps--;
      this.egval = this.egval + this.deltas[this.state.stage];
      if (this.state.stageStep >= this.stages[this.state.stage]) {
        this.state.stage++;
        this.state.stageStep = 0;
      }
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
  triggerRelease() {
    if (this.state.stage < stagesEnum.release) {
      this.state.stage = stagesEnum.release;
      this.state.stageStep = 0;
      this.stages[stagesEnum.release] =
        this.egval / this.deltas[stagesEnum.release];
    }
  }
}
