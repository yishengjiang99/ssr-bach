import { cb } from 'ava';
import { centibel, centime } from './centTone';
/**
ABSOLUTE CENTIBELS - An absolute measure of the attenuation of a signal, based on a reference of
zero being no attenuation. A centibel is a tenth of a decibel, or a ratio in signal amplitude of the two
hundredth root of 10, approximately 1.011579454.
RELATIVE CENTIBELS - A relative measure of the attenua
 */

export enum EnvelopeTarget {
  VOLUME,
  PITCH,
  FILTER,
}
enum stages {
  delay,
  attack,
  hold,
  decay,
  release,
  done,
}
const dbfs = 1440;

export class Envelope {
  target: EnvelopeTarget;
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
  ampCB: number;
  modifier: number;
  constructor(
    envelopePhases: centime[],
    sustainCB: centibel,
    sampleRate: number = 48000
  ) {
    this.stages = envelopePhases.map((centisec) =>
      centisec <= -12000 ? 1 : Math.pow(2, centisec / 1200) * sampleRate
    );
    const amts = [0, 0, dbfs, dbfs, dbfs - sustainCB, 0];
    const { delay, attack, hold, decay, release } = stages;
    this.deltas = [
      0,
      amts[attack] - amts[delay],
      amts[hold] - amts[attack],
      amts[decay] - amts[hold],
      amts[release] - amts[hold],
      0,
    ].map((change, idx) => change / this.stages[idx]);
    this.ampCB = 0;
  }
  modulate(fn) {
    fn();
  }
  get done() {
    return this.ampCB < -10 || this.state.stage == stages.done;
  }
  get val() {
    this.ampCB += this.deltas[this.state.stage];
    this.state.stageStep++;
    if (this.state.stageStep >= this.stages[this.state.stage]) {
      this.state.stage++;
      this.state.stageStep = 0;
    }
    return this.ampCB;
  }
  get gain() {
    return Math.pow(10, (1 - this.val) / 200);
  }
  get stage() {
    return this.state.stage;
  }
  triggerRelease() {
    if (this.state.stage < stages.release) {
      this.state.stage = stages.release;
      this.state.stageStep = 0;
      this.stages[stages.release] = this.ampCB / this.deltas[stages.release];
    }
  }
}
