import { SFGenerator } from './generator';

export type Phdr = {
  name: string;
  presetId: number;
  bankId: number;
  pbagIndex: number;
  pbags?: Pbag[];
};
export type SFGen = SFGenerator;
export type Pbag = {
  pgen_id: number;
  pmod_id: number;
  pgens: Record<number, SFGenerator>;
};
export type IBag = {
  igen_id: number;
  imod_id: number;
  igens: Record<number, SFGenerator>;
  sample?: Shdr;
};
export type Mod = {
  src: number;
  dest: number;
  amt: number;
  amtSrc: number;
  transpose: number;
};
export type InstrHeader = { name: string; iBagIndex: number; ibags?: IBag[] };
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
export type GenSet = Record<number, SFGenerator>;
