export type centTone = number;
export type TimeCent = number;
export type centibel = number;

export type LFO = {
  default?: boolean;
  delay: TimeCent;
  freq: centTone;
  effects: {
    pitch: centTone;
    filter: centTone;
    volume: centibel;
  };
};
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
export function centidb2gain(centibel) {
  return Math.pow(10, centibel / 200);
}
