function genstr() {
	return [
		"StartAddrOfs",
		"EndAddrOfs",
		"StartLoopAddrOfs",
		"EndLoopAddrOfs",
		"StartAddrCoarseOfs",
		"ModLFO2Pitch",
		"VibLFO2Pitch",
		"ModEnv2Pitch",
		"FilterFc",
		"FilterQ",
		"ModLFO2FilterFc",
		"ModEnv2FilterFc",
		"EndAddrCoarseOfs",
		"ModLFO2Vol",
		"Unused1",
		"ChorusSend",
		"ReverbSend",
		"Pan",
		"Unused2",
		"Unused3",
		"Unused4",
		"ModLFODelay",
		"ModLFOFreq",
		"VibLFODelay",
		"VibLFOFreq",
		"ModEnvDelay",
		"ModEnvAttack",
		"ModEnvHold",
		"ModEnvDecay",
		"ModEnvSustain",
		"ModEnvRelease",
		"Key2ModEnvHold",
		"Key2ModEnvDecay",
		"VolEnvDelay",
		"VolEnvAttack",
		"VolEnvHold",
		"VolEnvDecay",
		"VolEnvSustain",
		"VolEnvRelease",
		"Key2VolEnvHold",
		"Key2VolEnvDecay",
		"Instrument",
		"Reserved1",
		"KeyRange",
		"VelRange",
		"StartLoopAddrCoarseOfs",
		"Keynum",
		"Velocity",
		"Attenuation",
		"Reserved2",
		"EndLoopAddrCoarseOfs",
		"CoarseTune",
		"FineTune",
		"SampleId",
		"SampleModes",
		"Reserved3",
		"ScaleTune",
		"ExclusiveClass",
		"OverrideRootKey",
		"Dummy",
	];
}

/**
 * proxys comma-separated str of attributes into
 * dot-accessing objects to make beter autocompletes in vscode
 * @param attrs csv strings
 * @returns Proxy<string,number>
 */
function newSFZone(attrs) {
	const attributeKeys = genstr();
	const attributeValues = attrs.map((s) => parseInt(s));
	return new Proxy(attributeValues, {
		get: (target, key) => {
			const idx = attributeKeys.indexOf(key);
			return idx > -1 ? target[idx] : null;
		},
	});
}

//export function zoneProxy()
