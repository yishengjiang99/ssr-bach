export var ch_state;
(function (ch_state) {
    ch_state[ch_state["attack"] = 0] = "attack";
    ch_state[ch_state["hold"] = 1] = "hold";
    ch_state[ch_state["decay"] = 2] = "decay";
    ch_state[ch_state["releasing"] = 3] = "releasing";
})(ch_state || (ch_state = {}));
const defaultLFO = {
    delay: 0,
    freq: 1,
    effects: { pitch: 0, filter: 0, volume: 0 },
};
export var sf_gen_id;
(function (sf_gen_id) {
    sf_gen_id[sf_gen_id["startAddrsOffset"] = 0] = "startAddrsOffset";
    sf_gen_id[sf_gen_id["endAddrsOffset"] = 1] = "endAddrsOffset";
    sf_gen_id[sf_gen_id["startloopAddrsOffset"] = 2] = "startloopAddrsOffset";
    sf_gen_id[sf_gen_id["endloopAddrsOffset"] = 3] = "endloopAddrsOffset";
    sf_gen_id[sf_gen_id["startAddrsCoarseOffset"] = 4] = "startAddrsCoarseOffset";
    sf_gen_id[sf_gen_id["modLfoToPitch"] = 5] = "modLfoToPitch";
    sf_gen_id[sf_gen_id["vibLfoToPitch"] = 6] = "vibLfoToPitch";
    sf_gen_id[sf_gen_id["modEnvToPitch"] = 7] = "modEnvToPitch";
    sf_gen_id[sf_gen_id["initialFilterFc"] = 8] = "initialFilterFc";
    sf_gen_id[sf_gen_id["initialFilterQ"] = 9] = "initialFilterQ";
    sf_gen_id[sf_gen_id["modLfoToFilterFc"] = 10] = "modLfoToFilterFc";
    sf_gen_id[sf_gen_id["modEnvToFilterFc"] = 11] = "modEnvToFilterFc";
    sf_gen_id[sf_gen_id["endAddrsCoarseOffset"] = 12] = "endAddrsCoarseOffset";
    sf_gen_id[sf_gen_id["modLfoToVolume"] = 13] = "modLfoToVolume";
    sf_gen_id[sf_gen_id["unused1"] = 14] = "unused1";
    sf_gen_id[sf_gen_id["chorusEffectsSend"] = 15] = "chorusEffectsSend";
    sf_gen_id[sf_gen_id["reverbEffectsSend"] = 16] = "reverbEffectsSend";
    sf_gen_id[sf_gen_id["pan"] = 17] = "pan";
    sf_gen_id[sf_gen_id["unused2"] = 18] = "unused2";
    sf_gen_id[sf_gen_id["unused3"] = 19] = "unused3";
    sf_gen_id[sf_gen_id["unused4"] = 20] = "unused4";
    sf_gen_id[sf_gen_id["delayModLFO"] = 21] = "delayModLFO";
    sf_gen_id[sf_gen_id["freqModLFO"] = 22] = "freqModLFO";
    sf_gen_id[sf_gen_id["delayVibLFO"] = 23] = "delayVibLFO";
    sf_gen_id[sf_gen_id["freqVibLFO"] = 24] = "freqVibLFO";
    sf_gen_id[sf_gen_id["delayModEnv"] = 25] = "delayModEnv";
    sf_gen_id[sf_gen_id["attackModEnv"] = 26] = "attackModEnv";
    sf_gen_id[sf_gen_id["holdModEnv"] = 27] = "holdModEnv";
    sf_gen_id[sf_gen_id["decayModEnv"] = 28] = "decayModEnv";
    sf_gen_id[sf_gen_id["sustainModEnv"] = 29] = "sustainModEnv";
    sf_gen_id[sf_gen_id["releaseModEnv"] = 30] = "releaseModEnv";
    sf_gen_id[sf_gen_id["keynumToModEnvHold"] = 31] = "keynumToModEnvHold";
    sf_gen_id[sf_gen_id["keynumToModEnvDecay"] = 32] = "keynumToModEnvDecay";
    sf_gen_id[sf_gen_id["delayVolEnv"] = 33] = "delayVolEnv";
    sf_gen_id[sf_gen_id["attackVolEnv"] = 34] = "attackVolEnv";
    sf_gen_id[sf_gen_id["holdVolEnv"] = 35] = "holdVolEnv";
    sf_gen_id[sf_gen_id["decayVolEnv"] = 36] = "decayVolEnv";
    sf_gen_id[sf_gen_id["sustainVolEnv"] = 37] = "sustainVolEnv";
    sf_gen_id[sf_gen_id["releaseVolEnv"] = 38] = "releaseVolEnv";
    sf_gen_id[sf_gen_id["keynumToVolEnvHold"] = 39] = "keynumToVolEnvHold";
    sf_gen_id[sf_gen_id["keynumToVolEnvDecay"] = 40] = "keynumToVolEnvDecay";
    sf_gen_id[sf_gen_id["instrument"] = 41] = "instrument";
    sf_gen_id[sf_gen_id["reserved1"] = 42] = "reserved1";
    sf_gen_id[sf_gen_id["keyRange"] = 43] = "keyRange";
    sf_gen_id[sf_gen_id["velRange"] = 44] = "velRange";
    sf_gen_id[sf_gen_id["startloopAddrsCoarse"] = 45] = "startloopAddrsCoarse";
    sf_gen_id[sf_gen_id["keynum"] = 46] = "keynum";
    sf_gen_id[sf_gen_id["velocity"] = 47] = "velocity";
    sf_gen_id[sf_gen_id["initialAttenuation"] = 48] = "initialAttenuation";
    sf_gen_id[sf_gen_id["reserved2"] = 49] = "reserved2";
    sf_gen_id[sf_gen_id["endloopAddrsCoarse"] = 50] = "endloopAddrsCoarse";
    sf_gen_id[sf_gen_id["coarseTune"] = 51] = "coarseTune";
    sf_gen_id[sf_gen_id["fineTune"] = 52] = "fineTune";
    sf_gen_id[sf_gen_id["sampleID"] = 53] = "sampleID";
    sf_gen_id[sf_gen_id["sampleModes"] = 54] = "sampleModes";
    sf_gen_id[sf_gen_id["reserved3"] = 55] = "reserved3";
    sf_gen_id[sf_gen_id["scaleTuning"] = 56] = "scaleTuning";
    sf_gen_id[sf_gen_id["exclusiveClass"] = 57] = "exclusiveClass";
    sf_gen_id[sf_gen_id["overridingRootKey"] = 58] = "overridingRootKey";
    sf_gen_id[sf_gen_id["unused5"] = 59] = "unused5";
    sf_gen_id[sf_gen_id["endOper"] = 60] = "endOper";
})(sf_gen_id || (sf_gen_id = {}));
export var mergeTypes;
(function (mergeTypes) {
    mergeTypes[mergeTypes["SET_INST_DEFAULT"] = 0] = "SET_INST_DEFAULT";
    mergeTypes[mergeTypes["SET_INST"] = 1] = "SET_INST";
    mergeTypes[mergeTypes["SET_PBAG"] = 2] = "SET_PBAG";
    mergeTypes[mergeTypes["SET_PBAGDEFAULT"] = 3] = "SET_PBAGDEFAULT";
})(mergeTypes || (mergeTypes = {}));
export var LOOPMODES;
(function (LOOPMODES) {
    LOOPMODES[LOOPMODES["NO_LOOP"] = 0] = "NO_LOOP";
    LOOPMODES[LOOPMODES["CONTINUOUS_LOOP"] = 1] = "CONTINUOUS_LOOP";
    LOOPMODES[LOOPMODES["NO_LOOP_EQ"] = 2] = "NO_LOOP_EQ";
    LOOPMODES[LOOPMODES["LOOP_DURATION_PRESS"] = 3] = "LOOP_DURATION_PRESS";
})(LOOPMODES || (LOOPMODES = {}));
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
const { startAddrsOffset, endAddrsOffset, startloopAddrsOffset, endloopAddrsOffset, startAddrsCoarseOffset, } = sf_gen_id;
