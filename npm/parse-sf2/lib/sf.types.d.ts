import { SFZone } from './Zone';
export declare type FindPresetProps = {
    bankId: number;
    presetId: number;
    key: number;
    vel: number;
};
export declare type DecibelCent = number;
export declare type TimeCent = number;
export declare enum ch_state {
    attack = 0,
    hold = 1,
    decay = 2,
    releasing = 3
}
export declare type GenRange = {
    lo: number;
    hi: number;
};
export declare type Shdr = {
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
declare const defaultLFO: {
    delay: number;
    freq: number;
    effects: {
        pitch: number;
        filter: number;
        volume: number;
    };
};
export declare type LFOParams = typeof defaultLFO;
export declare enum sf_gen_id {
    startAddrsOffset = 0,
    endAddrsOffset = 1,
    startloopAddrsOffset = 2,
    endloopAddrsOffset = 3,
    startAddrsCoarseOffset = 4,
    modLfoToPitch = 5,
    vibLfoToPitch = 6,
    modEnvToPitch = 7,
    initialFilterFc = 8,
    initialFilterQ = 9,
    modLfoToFilterFc = 10,
    modEnvToFilterFc = 11,
    endAddrsCoarseOffset = 12,
    modLfoToVolume = 13,
    unused1 = 14,
    chorusEffectsSend = 15,
    reverbEffectsSend = 16,
    pan = 17,
    unused2 = 18,
    unused3 = 19,
    unused4 = 20,
    delayModLFO = 21,
    freqModLFO = 22,
    delayVibLFO = 23,
    freqVibLFO = 24,
    delayModEnv = 25,
    attackModEnv = 26,
    holdModEnv = 27,
    decayModEnv = 28,
    sustainModEnv = 29,
    releaseModEnv = 30,
    keynumToModEnvHold = 31,
    keynumToModEnvDecay = 32,
    delayVolEnv = 33,
    attackVolEnv = 34,
    holdVolEnv = 35,
    decayVolEnv = 36,
    sustainVolEnv = 37,
    releaseVolEnv = 38,
    keynumToVolEnvHold = 39,
    keynumToVolEnvDecay = 40,
    instrument = 41,
    reserved1 = 42,
    keyRange = 43,
    velRange = 44,
    startloopAddrsCoarse = 45,
    keynum = 46,
    velocity = 47,
    initialAttenuation = 48,
    reserved2 = 49,
    endloopAddrsCoarse = 50,
    coarseTune = 51,
    fineTune = 52,
    sampleID = 53,
    sampleModes = 54,
    reserved3 = 55,
    scaleTuning = 56,
    exclusiveClass = 57,
    overridingRootKey = 58,
    unused5 = 59,
    endOper = 60
}
export declare enum mergeTypes {
    SET_INST_DEFAULT = 0,
    SET_INST = 1,
    SET_PBAG = 2,
    SET_PBAGDEFAULT = 3
}
export declare type centTone = number;
export declare type centibel = number;
export declare type centime = number;
export declare enum LOOPMODES {
    NO_LOOP = 0,
    CONTINUOUS_LOOP = 1,
    NO_LOOP_EQ = 2,
    LOOP_DURATION_PRESS = 3
}
export declare type Range = {
    lo: number;
    hi: number;
};
export declare const generatorNames: string[];
export declare type Phdr = {
    name: string;
    presetId: number;
    bankId: number;
    pbagIndex: number;
    pbags: number[];
    defaultBag: number;
    insts: number[];
};
export declare type Pbag = {
    pgen_id: number;
    pmod_id: number;
    pzone: SFZone;
};
export declare type IBag = {
    igen_id: number;
    imod_id: number;
    izone: SFZone;
};
export declare type Mod = {
    src: number;
    dest: number;
    amt: number;
    amtSrc: number;
    transpose: number;
};
export declare type InstrHeader = {
    name: string;
    iBagIndex: number;
    ibags?: number[];
    defaultIbag?: number;
};
export {};
