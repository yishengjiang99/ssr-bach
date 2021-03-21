type centTone = number;
type TimeCent = number;
export type centibel = number;
type Effects = {
  pitch: centTone;
  filter: centTone;
  volume: centibel;
};
type EnvelopePhases = {
  delay: any;
  attack;
  decay;
  release;
  hold;
};
export class Envelope {
  effects: {
    pitch: centTone;
    filter: centTone;
    volume: centibel;
  } = {
    pitch: 0,
    filter: 0,
    volume: 0,
  };
  phases: EnvelopePhases = {
    decay: 0,
    attack: -0,
    delay: 0.10001812246532978,
    release: -3986,
    hold: -3986,
  };
  sustain: number = 300;
}
export class LFO {
  delay: TimeCent = 0;
  freq: centTone = 0;
  effects: {
    pitch: centTone;
    filter: centTone;
    volume: centibel;
  } = {
    pitch: 0,
    filter: 0,
    volume: 0,
  };
}
export enum LOOPMODES {
  NO_LOOP,
  CONTINUOUS_LOOP,
  NO_LOOP_EQ,
  LOOP_DURATION_PRESS,
}
export function cent2hz(centiHz) {
  return 8.176 * Math.pow(2, centiHz / 1200.0);
}
export function timecent2sec(timecent) {
  return Math.pow(2, timecent / 1200.0);
}
export function centidb2gain(timecent) {
  return Math.pow(2, timecent / 1200.0);
}
