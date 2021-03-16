#define SFGEN_startAddrsOffset 0
#define SFGEN_endAddrsOffset 1
#define SFGEN_startloopAddrsOffset 2
#define SFGEN_endloopAddrsOffset 3
#define SFGEN_startAddrsCoarseOffset 4
#define SFGEN_modLfoToPitch 5
#define SFGEN_vibLfoToPitch 6
#define SFGEN_modEnvToPitch 7
#define SFGEN_initialFilterFc 8
#define SFGEN_initialFilterQ 9
#define SFGEN_modLfoToFilterFc 10
#define SFGEN_modEnvToFilterFc 11
#define SFGEN_endAddrsCoarseOffset 12
#define SFGEN_modLfoToVolume 13
#define SFGEN_unused1 14
#define SFGEN_chorusEffectsSend 15
#define SFGEN_reverbEffectsSend 16
#define SFGEN_pan 17
#define SFGEN_unused2 18
#define SFGEN_unused3 19
#define SFGEN_unused4 20
#define SFGEN_delayModLFO 21
#define SFGEN_freqModLFO 22
#define SFGEN_delayVibLFO 23
#define SFGEN_freqVibLFO 24
#define SFGEN_delayModEnv 25
#define SFGEN_attackModEnv 26
#define SFGEN_holdModEnv 27
#define SFGEN_decayModEnv 28
#define SFGEN_sustainModEnv 29
#define SFGEN_releaseModEnv 30
#define SFGEN_keynumToModEnvHold 31
#define SFGEN_keynumToModEnvDecay 32
#define SFGEN_delayVolEnv 33
#define SFGEN_attackVolEnv 34
#define SFGEN_holdVolEnv 35
#define SFGEN_decayVolEnv 36
#define SFGEN_sustainVolEnv 37
#define SFGEN_releaseVolEnv 38
#define SFGEN_keynumToVolEnvHold 39
#define SFGEN_keynumToVolEnvDecay 40
#define SFGEN_instrument 41
#define SFGEN_reserved1 42
#define SFGEN_keyRange 43
#define SFGEN_velRange 44
#define SFGEN_startloopAddrsCoarse 45
#define SFGEN_keynum 46
#define SFGEN_velocity 47
#define SFGEN_initialAttenuation 48
#define SFGEN_reserved2 49
#define SFGEN_endloopAddrsCoarse 50
#define SFGEN_coarseTune 51
#define SFGEN_fineTune 52
#define SFGEN_sampleID 53
#define SFGEN_sampleModes 54
#define SFGEN_reserved3 55
#define SFGEN_scaleTuning 56
#define SFGEN_exclusiveClass 57
#define SFGEN_overridingRootKey 58
#define SFGEN_unused5 59
#define SFGEN_endOper 60
#define fivezeros 0, 0, 0, 0, 0
char *generator[60] = {"Gen_StartAddrOfs", "Gen_EndAddrOfs", "Gen_StartLoopAddrOfs", "Gen_EndLoopAddrOfs", "Gen_StartAddrCoarseOfs", "Gen_ModLFO2Pitch", "Gen_VibLFO2Pitch", "Gen_ModEnv2Pitch", "Gen_FilterFc", "Gen_FilterQ", "Gen_ModLFO2FilterFc", "Gen_ModEnv2FilterFc", "Gen_EndAddrCoarseOfs", "Gen_ModLFO2Vol", "Gen_Unused1", "Gen_ChorusSend", "Gen_ReverbSend", "Gen_Pan", "Gen_Unused2", "Gen_Unused3", "Gen_Unused4", "Gen_ModLFODelay", "Gen_ModLFOFreq", "Gen_VibLFODelay", "Gen_VibLFOFreq", "Gen_ModEnvDelay", "Gen_ModEnvAttack", "Gen_ModEnvHold", "Gen_ModEnvDecay", "Gen_ModEnvSustain", "Gen_ModEnvRelease", "Gen_Key2ModEnvHold", "Gen_Key2ModEnvDecay", "Gen_VolEnvDelay", "Gen_VolEnvAttack", "Gen_VolEnvHold", "Gen_VolEnvDecay", "Gen_VolEnvSustain", "Gen_VolEnvRelease", "Gen_Key2VolEnvHold", "Gen_Key2VolEnvDecay", "Gen_Instrument", "Gen_Reserved1", "Gen_KeyRange", "Gen_VelRange", "Gen_StartLoopAddrCoarseOfs", "Gen_Keynum", "Gen_Velocity", "Gen_Attenuation", "Gen_Reserved2", "Gen_EndLoopAddrCoarseOfs", "Gen_CoarseTune", "Gen_FineTune", "Gen_SampleId", "Gen_SampleModes", "Gen_Reserved3", "Gen_ScaleTune", "Gen_ExclusiveClass", "Gen_OverrideRootKey", "Gen_Dummy"};
uint16_t default_gen_vals[60] = {
	fivezeros,
	fivezeros,
	fivezeros,
	fivezeros,
	-11500, //SFGEN_delayModEnv 25
	-11500,
	-11500,
	-11500,
	240,	//sustain vol
	-11500, //30
	0,
	0,
	-11500, //SFGEN_delayVolEnv 33
	-11500,
	-11500,
	-11500,
	240, //sustain vol
	-11500,
	0,
	0,
	-1, //instrument
	0,
	127 << 7 | 0, //velrange+keyrange
	127 << 7 | 0,
	fivezeros, fivezeros, fivezeros, fivezeros

};
