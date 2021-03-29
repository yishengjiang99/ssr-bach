import { SFGenerator } from './generator';
import { SFZone } from './Zone';

export type Phdr = {
  name: string;
  presetId: number;
  bankId: number;
  pbagIndex: number;
  pbags?: number[]; // & not *
  defaultBag: number;
  insts?: number[];
  ibagSet?: Set<number>;
};
export type Pbag = {
  pgen_id: number;
  pmod_id: number;
  pzone: SFZone;
};
export type IBag = {
  igen_id: number;
  imod_id: number;
  izone: SFZone;
};
export type Mod = {
  src: number;
  dest: number;
  amt: number;
  amtSrc: number;
  transpose: number;
};
export type InstrHeader = {
  name: string;
  iBagIndex: number;
  ibags?: number[];
  defaultIbag?: number;
};
export type Shdr = {
  name: string;
  start: number;
  end: number;
  startLoop: number;
  endLoop: number;
  sampleRate: number;
  originalPitch: number;
  pitchCorrection: number;
  sampleLink: number;
  sampleType: number;
};
