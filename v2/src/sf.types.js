"use strict";
exports.__esModule = true;
exports.generatorTypes = exports.attributeGenerators = exports.adsrParams = exports.generators = exports.generatorNames = exports.ch_state = void 0;
var ch_state;
(function (ch_state) {
    ch_state[ch_state["attack"] = 0] = "attack";
    ch_state[ch_state["hold"] = 1] = "hold";
    ch_state[ch_state["decay"] = 2] = "decay";
    ch_state[ch_state["releasing"] = 3] = "releasing";
})(ch_state = exports.ch_state || (exports.ch_state = {}));
exports.generatorNames = "#define SFGEN_startAddrsOffset         0\n#define SFGEN_endAddrsOffset           1\n#define SFGEN_startloopAddrsOffset     2\n#define SFGEN_endloopAddrsOffset       3\n#define SFGEN_startAddrsCoarseOffset   4\n#define SFGEN_modLfoToPitch            5\n#define SFGEN_vibLfoToPitch            6\n#define SFGEN_modEnvToPitch            7\n#define SFGEN_initialFilterFc          8\n#define SFGEN_initialFilterQ           9\n#define SFGEN_modLfoToFilterFc         10\n#define SFGEN_modEnvToFilterFc         11\n#define SFGEN_endAddrsCoarseOffset     12\n#define SFGEN_modLfoToVolume           13\n#define SFGEN_unused1                  14\n#define SFGEN_chorusEffectsSend        15\n#define SFGEN_reverbEffectsSend        16\n#define SFGEN_pan                      17\n#define SFGEN_unused2                  18\n#define SFGEN_unused3                  19\n#define SFGEN_unused4                  20\n#define SFGEN_delayModLFO              21\n#define SFGEN_freqModLFO               22\n#define SFGEN_delayVibLFO              23\n#define SFGEN_freqVibLFO               24\n#define SFGEN_delayModEnv              25\n#define SFGEN_attackModEnv             26\n#define SFGEN_holdModEnv               27\n#define SFGEN_decayModEnv              28\n#define SFGEN_sustainModEnv            29\n#define SFGEN_releaseModEnv            30\n#define SFGEN_keynumToModEnvHold       31\n#define SFGEN_keynumToModEnvDecay      32\n#define SFGEN_delayVolEnv              33\n#define SFGEN_attackVolEnv             34\n#define SFGEN_holdVolEnv               35\n#define SFGEN_decayVolEnv              36\n#define SFGEN_sustainVolEnv            37\n#define SFGEN_releaseVolEnv            38\n#define SFGEN_keynumToVolEnvHold       39\n#define SFGEN_keynumToVolEnvDecay      40\n#define SFGEN_instrument               41\n#define SFGEN_reserved1                42\n#define SFGEN_keyRange                 43\n#define SFGEN_velRange                 44\n#define SFGEN_startloopAddrsCoarse     45\n#define SFGEN_keynum                   46\n#define SFGEN_velocity                 47\n#define SFGEN_initialAttenuation       48\n#define SFGEN_reserved2                49\n#define SFGEN_endloopAddrsCoarse       50\n#define SFGEN_coarseTune               51\n#define SFGEN_fineTune                 52\n#define SFGEN_sampleID                 53\n#define SFGEN_sampleModes              54\n#define SFGEN_reserved3                55\n#define SFGEN_scaleTuning              56\n#define SFGEN_exclusiveClass           57\n#define SFGEN_overridingRootKey        58\n#define SFGEN_unused5                  59\n#define SFGEN_endOper                  60"
    .trim()
    .split("\n")
    .map(function (line) { return line.split(/\s+/)[1]; })
    .map(function (token) { return token.replace("SFGEN_", ""); });
var generators;
(function (generators) {
    generators[generators["startAddrsOffset"] = 0] = "startAddrsOffset";
    generators[generators["endAddrsOffset"] = 1] = "endAddrsOffset";
    generators[generators["startloopAddrsOffset"] = 2] = "startloopAddrsOffset";
    generators[generators["endloopAddrsOffset"] = 3] = "endloopAddrsOffset";
    generators[generators["startAddrsCoarseOffset"] = 4] = "startAddrsCoarseOffset";
    generators[generators["modLfoToPitch"] = 5] = "modLfoToPitch";
    generators[generators["vibLfoToPitch"] = 6] = "vibLfoToPitch";
    generators[generators["modEnvToPitch"] = 7] = "modEnvToPitch";
    generators[generators["initialFilterFc"] = 8] = "initialFilterFc";
    generators[generators["initialFilterQ"] = 9] = "initialFilterQ";
    generators[generators["modLfoToFilterFc"] = 10] = "modLfoToFilterFc";
    generators[generators["modEnvToFilterFc"] = 11] = "modEnvToFilterFc";
    generators[generators["endAddrsCoarseOffset"] = 12] = "endAddrsCoarseOffset";
    generators[generators["modLfoToVolume"] = 13] = "modLfoToVolume";
    generators[generators["unused1"] = 14] = "unused1";
    generators[generators["chorusEffectsSend"] = 15] = "chorusEffectsSend";
    generators[generators["reverbEffectsSend"] = 16] = "reverbEffectsSend";
    generators[generators["pan"] = 17] = "pan";
    generators[generators["unused2"] = 18] = "unused2";
    generators[generators["unused3"] = 19] = "unused3";
    generators[generators["unused4"] = 20] = "unused4";
    generators[generators["delayModLFO"] = 21] = "delayModLFO";
    generators[generators["freqModLFO"] = 22] = "freqModLFO";
    generators[generators["delayVibLFO"] = 23] = "delayVibLFO";
    generators[generators["freqVibLFO"] = 24] = "freqVibLFO";
    generators[generators["delayModEnv"] = 25] = "delayModEnv";
    generators[generators["attackModEnv"] = 26] = "attackModEnv";
    generators[generators["holdModEnv"] = 27] = "holdModEnv";
    generators[generators["decayModEnv"] = 28] = "decayModEnv";
    generators[generators["sustainModEnv"] = 29] = "sustainModEnv";
    generators[generators["releaseModEnv"] = 30] = "releaseModEnv";
    generators[generators["keynumToModEnvHold"] = 31] = "keynumToModEnvHold";
    generators[generators["keynumToModEnvDecay"] = 32] = "keynumToModEnvDecay";
    generators[generators["delayVolEnv"] = 33] = "delayVolEnv";
    generators[generators["attackVolEnv"] = 34] = "attackVolEnv";
    generators[generators["holdVolEnv"] = 35] = "holdVolEnv";
    generators[generators["decayVolEnv"] = 36] = "decayVolEnv";
    generators[generators["sustainVolEnv"] = 37] = "sustainVolEnv";
    generators[generators["releaseVolEnv"] = 38] = "releaseVolEnv";
    generators[generators["keynumToVolEnvHold"] = 39] = "keynumToVolEnvHold";
    generators[generators["keynumToVolEnvDecay"] = 40] = "keynumToVolEnvDecay";
    generators[generators["instrument"] = 41] = "instrument";
    generators[generators["reserved1"] = 42] = "reserved1";
    generators[generators["keyRange"] = 43] = "keyRange";
    generators[generators["velRange"] = 44] = "velRange";
    generators[generators["startloopAddrsCoarse"] = 45] = "startloopAddrsCoarse";
    generators[generators["keynum"] = 46] = "keynum";
    generators[generators["velocity"] = 47] = "velocity";
    generators[generators["initialAttenuation"] = 48] = "initialAttenuation";
    generators[generators["reserved2"] = 49] = "reserved2";
    generators[generators["endloopAddrsCoarse"] = 50] = "endloopAddrsCoarse";
    generators[generators["coarseTune"] = 51] = "coarseTune";
    generators[generators["fineTune"] = 52] = "fineTune";
    generators[generators["sampleID"] = 53] = "sampleID";
    generators[generators["sampleModes"] = 54] = "sampleModes";
    generators[generators["reserved3"] = 55] = "reserved3";
    generators[generators["scaleTuning"] = 56] = "scaleTuning";
    generators[generators["exclusiveClass"] = 57] = "exclusiveClass";
    generators[generators["overridingRootKey"] = 58] = "overridingRootKey";
    generators[generators["unused5"] = 59] = "unused5";
    generators[generators["endOper"] = 60] = "endOper";
})(generators = exports.generators || (exports.generators = {}));
exports.adsrParams = [
    generators.delayVolEnv,
    generators.attackVolEnv,
    generators.holdVolEnv,
    generators.decayVolEnv,
    generators.releaseVolEnv,
];
var startAddrsOffset = generators.startAddrsOffset, endAddrsOffset = generators.endAddrsOffset, startloopAddrsOffset = generators.startloopAddrsOffset, endloopAddrsOffset = generators.endloopAddrsOffset, startAddrsCoarseOffset = generators.startAddrsCoarseOffset;
exports.attributeGenerators = {
    sampleOffsets: [
        startAddrsOffset,
        endAddrsOffset,
        startloopAddrsOffset,
        endloopAddrsOffset,
        startAddrsCoarseOffset,
    ]
};
var generatorTypes;
(function (generatorTypes) {
    generatorTypes[generatorTypes["_GEN_TYPE_MASK"] = 15] = "_GEN_TYPE_MASK";
    generatorTypes[generatorTypes["GEN_FLOAT"] = 1] = "GEN_FLOAT";
    generatorTypes[generatorTypes["GEN_INT"] = 2] = "GEN_INT";
    generatorTypes[generatorTypes["GEN_UINT_ADD"] = 3] = "GEN_UINT_ADD";
    generatorTypes[generatorTypes["GEN_UINT_ADD15"] = 4] = "GEN_UINT_ADD15";
    generatorTypes[generatorTypes["GEN_KEYRANGE"] = 5] = "GEN_KEYRANGE";
    generatorTypes[generatorTypes["GEN_VELRANGE"] = 6] = "GEN_VELRANGE";
    generatorTypes[generatorTypes["GEN_LOOPMODE"] = 7] = "GEN_LOOPMODE";
    generatorTypes[generatorTypes["GEN_GROUP"] = 8] = "GEN_GROUP";
    generatorTypes[generatorTypes["GEN_KEYCENTER"] = 9] = "GEN_KEYCENTER";
})(generatorTypes = exports.generatorTypes || (exports.generatorTypes = {}));
