import { Envelope } from "ssr-cxt";

export type FindPresetProps = {
  bankId: number;
  presetId: number;
  key: number;
  vel: number;
};

export type Channel = {
  smpl: Shdr;
  length: number;
  ratio: number;
  iterator: number;
  envelope: Envelope;
  ztransform?: (input: number) => number;
};
export type RIFFSFBK = {
  pdta?: {
    offset: number;
    data: Preset[][];
  };
  sdta?: {
    offset: number;
    data: Buffer;
    size: number;
  };
};
export type Range = { lo: number; hi: number };
export type Phdr = {
  name: string;
  presetId: number;
  bankId: number;
  pbagIndex: number;
};
export type Generator = { operator: number; range: Range; amount: number; signed?: number };
export type Pbag = { pgen_id: number; pmod_id: number };
export type IBag = { igen_id: number; imod_id: number };
export type Mod = {
  src: number;
  dest: number;
  amt: number;
  amtSrc: number;
  transpose: number;
};
export type InstrHeader = { name: string; iBagIndex: number };
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
export type Zone = {
  velRange: Range;
  keyRange: Range;
  sample: Shdr;
  adsr: number[];
  sampleOffsets?: number[];
  generators?: Generator[];
  attributes?: {};
  parent?: Zone;
  rootKey?: number;
  lowPassFilter?: {
    centerFreq: number;
    q: number;
  };
  attentuation?: number;
};
export type Preset = Phdr & {
  zones?: Zone[];
};
export const generatorNames = `#define SFGEN_startAddrsOffset         0
#define SFGEN_endAddrsOffset           1
#define SFGEN_startloopAddrsOffset     2
#define SFGEN_endloopAddrsOffset       3
#define SFGEN_startAddrsCoarseOffset   4
#define SFGEN_modLfoToPitch            5
#define SFGEN_vibLfoToPitch            6
#define SFGEN_modEnvToPitch            7
#define SFGEN_initialFilterFc          8
#define SFGEN_initialFilterQ           9
#define SFGEN_modLfoToFilterFc         10
#define SFGEN_modEnvToFilterFc         11
#define SFGEN_endAddrsCoarseOffset     12
#define SFGEN_modLfoToVolume           13
#define SFGEN_unused1                  14
#define SFGEN_chorusEffectsSend        15
#define SFGEN_reverbEffectsSend        16
#define SFGEN_pan                      17
#define SFGEN_unused2                  18
#define SFGEN_unused3                  19
#define SFGEN_unused4                  20
#define SFGEN_delayModLFO              21
#define SFGEN_freqModLFO               22
#define SFGEN_delayVibLFO              23
#define SFGEN_freqVibLFO               24
#define SFGEN_delayModEnv              25
#define SFGEN_attackModEnv             26
#define SFGEN_holdModEnv               27
#define SFGEN_decayModEnv              28
#define SFGEN_sustainModEnv            29
#define SFGEN_releaseModEnv            30
#define SFGEN_keynumToModEnvHold       31
#define SFGEN_keynumToModEnvDecay      32
#define SFGEN_delayVolEnv              33
#define SFGEN_attackVolEnv             34
#define SFGEN_holdVolEnv               35
#define SFGEN_decayVolEnv              36
#define SFGEN_sustainVolEnv            37
#define SFGEN_releaseVolEnv            38
#define SFGEN_keynumToVolEnvHold       39
#define SFGEN_keynumToVolEnvDecay      40
#define SFGEN_instrument               41
#define SFGEN_reserved1                42
#define SFGEN_keyRange                 43
#define SFGEN_velRange                 44
#define SFGEN_startloopAddrsCoarse     45
#define SFGEN_keynum                   46
#define SFGEN_velocity                 47
#define SFGEN_initialAttenuation       48
#define SFGEN_reserved2                49
#define SFGEN_endloopAddrsCoarse       50
#define SFGEN_coarseTune               51
#define SFGEN_fineTune                 52
#define SFGEN_sampleID                 53
#define SFGEN_sampleModes              54
#define SFGEN_reserved3                55
#define SFGEN_scaleTuning              56
#define SFGEN_exclusiveClass           57
#define SFGEN_overridingRootKey        58
#define SFGEN_unused5                  59
#define SFGEN_endOper                  60`
  .trim()
  .split("\n")
  .map((line) => line.split(/\s+/)[1])
  .map((token) => token.replace("SFGEN_", ""));

export enum generators {
  startAddrsOffset,
  endAddrsOffset,
  startloopAddrsOffset,
  endloopAddrsOffset,
  startAddrsCoarseOffset,
  modLfoToPitch,
  vibLfoToPitch,
  modEnvToPitch,
  initialFilterFc,
  initialFilterQ,
  modLfoToFilterFc,
  modEnvToFilterFc,
  endAddrsCoarseOffset,
  modLfoToVolume,
  unused1,
  chorusEffectsSend,
  reverbEffectsSend,
  pan,
  unused2,
  unused3,
  unused4,
  delayModLFO,
  freqModLFO,
  delayVibLFO,
  freqVibLFO,
  delayModEnv,
  attackModEnv,
  holdModEnv,
  decayModEnv,
  sustainModEnv,
  releaseModEnv,
  keynumToModEnvHold,
  keynumToModEnvDecay,
  delayVolEnv,
  attackVolEnv,
  holdVolEnv,
  decayVolEnv,
  sustainVolEnv,
  releaseVolEnv,
  keynumToVolEnvHold,
  keynumToVolEnvDecay,
  instrument,
  reserved1,
  keyRange,
  velRange,
  startloopAddrsCoarse,
  keynum,
  velocity,
  initialAttenuation,
  reserved2,
  endloopAddrsCoarse,
  coarseTune,
  fineTune,
  sampleID,
  sampleModes,
  reserved3,
  scaleTuning,
  exclusiveClass,
  overridingRootKey,
  unused5,
  endOper,
}

export const adsrParams: number[] = [
  generators.delayVolEnv,
  generators.attackVolEnv,
  generators.holdVolEnv,
  generators.decayVolEnv,
  generators.releaseVolEnv,
];
const {
  startAddrsOffset,
  endAddrsOffset,
  startloopAddrsOffset,
  endloopAddrsOffset,
  startAddrsCoarseOffset,
} = generators;

export const attributeGenerators = {
  sampleOffsets: [startAddrsOffset, endAddrsOffset, startloopAddrsOffset, endloopAddrsOffset, startAddrsCoarseOffset],
};

export enum generatorTypes {
  _GEN_TYPE_MASK = 0x0f,
  GEN_FLOAT = 0x01,
  GEN_INT = 0x02,
  GEN_UINT_ADD = 0x03,
  GEN_UINT_ADD15 = 0x04,
  GEN_KEYRANGE = 0x05,
  GEN_VELRANGE = 0x06,
  GEN_LOOPMODE = 0x07,
  GEN_GROUP = 0x08,
  GEN_KEYCENTER = 0x09,
}
