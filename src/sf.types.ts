export type FindPresetProps = {
  bankId: number;
  presetId: number;
  key: number;
  vel: number;
};
export type DecibelCent = number;
export type TimeCent = number;
export enum ch_state {
  attack,
  hold,
  decay,
  releasing,
}

export type Range = { lo: number; hi: number };

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
  .split('\n')
  .map((line) => line.split(/\s+/)[1])
  .map((token) => token.replace('SFGEN_', ''));

export enum sf_gen_id {
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
  sf_gen_id.delayVolEnv,
  sf_gen_id.attackVolEnv,
  sf_gen_id.holdVolEnv,
  sf_gen_id.decayVolEnv,
  sf_gen_id.releaseVolEnv,
];
export const adsrModParams: number[] = [
  sf_gen_id.delayModEnv,
  sf_gen_id.attackModEnv,
  sf_gen_id.holdModEnv,
  sf_gen_id.decayModEnv,
  sf_gen_id.releaseModEnv,
];
const {
  startAddrsOffset,
  endAddrsOffset,
  startloopAddrsOffset,
  endloopAddrsOffset,
  startAddrsCoarseOffset,
} = sf_gen_id;

export const attributeGenerators = {
  sampleOffsets: [
    startAddrsOffset,
    endAddrsOffset,
    startloopAddrsOffset,
    endloopAddrsOffset,
    startAddrsCoarseOffset,
  ],
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
export const keys88 = /*([1,2,3,4,5,6,7].map(oct=> keys.map(k=>{
  return k+oct
}).join(",")).join(",")).split(',')
*/ [
  'A0',
  'Bb0',
  'B0',
  'C1',
  'Db1',
  'D1',
  'Eb1',
  'E1',
  'F1',
  'Gb1',
  'G1',
  'Ab1',
  'A1',
  'Bb1',
  'B1',
  'C2',
  'Db2',
  'D2',
  'Eb2',
  'E2',
  'F2',
  'Gb2',
  'G2',
  'Ab2',
  'A2',
  'Bb2',
  'B2',
  'C3',
  'Db3',
  'D3',
  'Eb3',
  'E3',
  'F3',
  'Gb3',
  'G3',
  'Ab3',
  'A3',
  'Bb3',
  'B3',
  'C4',
  'Db4',
  'D4',
  'Eb4',
  'E4',
  'F4',
  'Gb4',
  'G4',
  'Ab4',
  'A4',
  'Bb4',
  'B4',
  'C5',
  'Db5',
  'D5',
  'Eb5',
  'E5',
  'F5',
  'Gb5',
  'G5',
  'Ab5',
  'A5',
  'Bb5',
  'B5',
  'C6',
  'Db6',
  'D6',
  'Eb6',
  'E6',
  'F6',
  'Gb6',
  'G6',
  'Ab6',
  'A6',
  'Bb6',
  'B6',
  'C7',
  'Db7',
  'D7',
  'Eb7',
  'E7',
  'F7',
  'Gb7',
  'G7',
  'Ab7',
  'A7',
  'Bb7',
  'B7',
];
