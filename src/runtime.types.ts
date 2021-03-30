import { SFZone } from './Zone';

export type centTone = number;
export type TimeCent = number;
export type centibel = number;
export type centime = number;
export type LFOParams = {
  delay: centime;
  freq: centTone;
  effects: ModEffects;
};
export type EnvPhases = {
  delay: centime;
  attack: centime;
  decay: centime;
  release: centime;
  hold: centime;
};

export type ModEffects = {
  volume?: number;
  filter?: number;
  pitch?: number;
};
export type KRate = number;
export interface ARate {
  static?: KRate;
  runtime: () => number;
}
export interface ModSource {
  val: Generator<number, number, null>;
  unit: centibel | centibel | centTone;
}
export interface VoiceState {
  gain: ARate;
  pitch: ARate;
  filter: ARate;
  filterQ: KRate;
  phase: ARate;
  pan: {
    left: KRate;
    right: KRate;
  };
}
export interface Ctx {
  sampleRate: number;
  chanVols: () => number[];
  masterVol: () => number;
}
export interface Note {
  key: number;
  velocity: number;
  channel: number;
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
export enum LOOPMODES {
  NO_LOOP,
  CONTINUOUS_LOOP,
  NO_LOOP_EQ,
  LOOP_DURATION_PRESS,
}

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
export enum stagesEnum {
  delay,
  attack,
  hold,
  decay,
  release,
  done,
}
export const dbfs = 1440;
