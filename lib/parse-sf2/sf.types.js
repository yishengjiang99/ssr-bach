"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.generatorNames = exports.LOOPMODES = exports.mergeTypes = exports.sf_gen_id = exports.ch_state = void 0;
var ch_state;
exports.ch_state = ch_state;

(function (ch_state) {
  ch_state[ch_state["attack"] = 0] = "attack";
  ch_state[ch_state["hold"] = 1] = "hold";
  ch_state[ch_state["decay"] = 2] = "decay";
  ch_state[ch_state["releasing"] = 3] = "releasing";
})(ch_state || (exports.ch_state = ch_state = {}));

var defaultLFO = {
  delay: 0,
  freq: 1,
  effects: {
    pitch: 0,
    filter: 0,
    volume: 0
  }
};
var sf_gen_id;
exports.sf_gen_id = sf_gen_id;

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
})(sf_gen_id || (exports.sf_gen_id = sf_gen_id = {}));

var mergeTypes;
exports.mergeTypes = mergeTypes;

(function (mergeTypes) {
  mergeTypes[mergeTypes["SET_INST_DEFAULT"] = 0] = "SET_INST_DEFAULT";
  mergeTypes[mergeTypes["SET_INST"] = 1] = "SET_INST";
  mergeTypes[mergeTypes["SET_PBAG"] = 2] = "SET_PBAG";
  mergeTypes[mergeTypes["SET_PBAGDEFAULT"] = 3] = "SET_PBAGDEFAULT";
})(mergeTypes || (exports.mergeTypes = mergeTypes = {}));

var LOOPMODES;
exports.LOOPMODES = LOOPMODES;

(function (LOOPMODES) {
  LOOPMODES[LOOPMODES["NO_LOOP"] = 0] = "NO_LOOP";
  LOOPMODES[LOOPMODES["CONTINUOUS_LOOP"] = 1] = "CONTINUOUS_LOOP";
  LOOPMODES[LOOPMODES["NO_LOOP_EQ"] = 2] = "NO_LOOP_EQ";
  LOOPMODES[LOOPMODES["LOOP_DURATION_PRESS"] = 3] = "LOOP_DURATION_PRESS";
})(LOOPMODES || (exports.LOOPMODES = LOOPMODES = {}));

var generatorNames = "#define SFGEN_startAddrsOffset         0\n#define SFGEN_endAddrsOffset           1\n#define SFGEN_startloopAddrsOffset     2\n#define SFGEN_endloopAddrsOffset       3\n#define SFGEN_startAddrsCoarseOffset   4\n#define SFGEN_modLfoToPitch            5\n#define SFGEN_vibLfoToPitch            6\n#define SFGEN_modEnvToPitch            7\n#define SFGEN_initialFilterFc          8\n#define SFGEN_initialFilterQ           9\n#define SFGEN_modLfoToFilterFc         10\n#define SFGEN_modEnvToFilterFc         11\n#define SFGEN_endAddrsCoarseOffset     12\n#define SFGEN_modLfoToVolume           13\n#define SFGEN_unused1                  14\n#define SFGEN_chorusEffectsSend        15\n#define SFGEN_reverbEffectsSend        16\n#define SFGEN_pan                      17\n#define SFGEN_unused2                  18\n#define SFGEN_unused3                  19\n#define SFGEN_unused4                  20\n#define SFGEN_delayModLFO              21\n#define SFGEN_freqModLFO               22\n#define SFGEN_delayVibLFO              23\n#define SFGEN_freqVibLFO               24\n#define SFGEN_delayModEnv              25\n#define SFGEN_attackModEnv             26\n#define SFGEN_holdModEnv               27\n#define SFGEN_decayModEnv              28\n#define SFGEN_sustainModEnv            29\n#define SFGEN_releaseModEnv            30\n#define SFGEN_keynumToModEnvHold       31\n#define SFGEN_keynumToModEnvDecay      32\n#define SFGEN_delayVolEnv              33\n#define SFGEN_attackVolEnv             34\n#define SFGEN_holdVolEnv               35\n#define SFGEN_decayVolEnv              36\n#define SFGEN_sustainVolEnv            37\n#define SFGEN_releaseVolEnv            38\n#define SFGEN_keynumToVolEnvHold       39\n#define SFGEN_keynumToVolEnvDecay      40\n#define SFGEN_instrument               41\n#define SFGEN_reserved1                42\n#define SFGEN_keyRange                 43\n#define SFGEN_velRange                 44\n#define SFGEN_startloopAddrsCoarse     45\n#define SFGEN_keynum                   46\n#define SFGEN_velocity                 47\n#define SFGEN_initialAttenuation       48\n#define SFGEN_reserved2                49\n#define SFGEN_endloopAddrsCoarse       50\n#define SFGEN_coarseTune               51\n#define SFGEN_fineTune                 52\n#define SFGEN_sampleID                 53\n#define SFGEN_sampleModes              54\n#define SFGEN_reserved3                55\n#define SFGEN_scaleTuning              56\n#define SFGEN_exclusiveClass           57\n#define SFGEN_overridingRootKey        58\n#define SFGEN_unused5                  59\n#define SFGEN_endOper                  60".trim().split('\n').map(line => line.split(/\s+/)[1]).map(token => token.replace('SFGEN_', ''));
exports.generatorNames = generatorNames;
var {
  startAddrsOffset,
  endAddrsOffset,
  startloopAddrsOffset,
  endloopAddrsOffset,
  startAddrsCoarseOffset
} = sf_gen_id;