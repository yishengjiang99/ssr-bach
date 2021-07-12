importScripts(self.location.origin + "/libs.js");
importScripts(self.location.origin + "/zoneProxy.js");
const url = self.location.hash.length
	? decodeURIComponent(self.location.hash.substr(1))
	: "/GeneralUserGS.sf2";
const nchannels = 16,
	bytesPerChannelZone = 60,
	sampleRefs = 400;
var Module = {
	print: function (str) {
		postMessage(str);
	},
};
const wasmloaded = new Promise((resolve) => {
	Module.onRuntimeInitialized = function () {
		resolve(Module);
	};
});
const pdtaLoaded = new Promise((resolve) => {
	sfbkstream(url).then(resolve);
});
const channels = new Array(17);
const srb = new SharedArrayBuffer(
	nchannels * bytesPerChannelZone + sampleRefs * Uint32Array.BYTES_PER_ELEMENT
);

function sharedRegistar(srb, floatrb) {
	const sampleRegistar = new Uint32Array(srb.buffer, nchannels * bytesPerChannelZone, 400);
	const channelZones = new Int16Array(srb.buffer, 0, nchannels, 60);
	return {
		zoneInfo: (channelId) =>
			newSFZone(new Int16Array(srb.buffer, channelId * bytesPerChannelZone, 60)),
		getSampleRef: (sampleId) => sampleRegistar[sampleId],
		getSample: (sampleId) => {
			sampleId < sampleRefs - 1
				? floatrb.subarray(sampleRegistar[sampleId], sampleRegistar[sampleId + 1])
				: floatrb.subarray(sampleRegistar[sampleId]);
		},
		setSampleRef: (sampleId, ref) => (sampleRegistar[sampleId] = ref),
	};
}

const zones = new Int16Array(srb);
const sampleData = {};
const dup2 = new TransformStream();
wasmloaded.then(async (Module) => {
	const { pdtaBuffer, sdtaStart } = await pdtaLoaded;
	const a = Module._malloc(pdtaBuffer.byteLength);
	Module.HEAPU8.set(pdtaBuffer, a);
	Module.ccall("loadpdta", null, ["number"], [a], null);
	const shdrref = Module.ccall("shdrref", "number", [], [], null);

	function getShdr(samleId) {
		const hdrRef = shdrref + samleId * 48;
		const dv = Module.HEAPU8.buffer.slice(hdrRef, hdrRef + 48);
		const [start, end, startloop, endloop, sampleRate] = new Uint32Array(dv, 20, 5);
		const [originalPitch, pitchCorrection] = new Uint8Array(dv, 20 + 5 * 4, 2);
		return [start, end, startloop, endloop, sampleRate, originalPitch, pitchCorrection];
	}

	onmessage = async ({ data: { setProgram, noteOn, readable, sharePort } }) => {
		if (setProgram) {
			const { channel, pid } = setProgram;
			const ref = loadPreset(pid, channel == 9 ? 128 : 0);
			const npresets = Module.HEAPU32[ref >> 2];
			const zref = Module.HEAPU32[(ref >> 2) + 1];
			channels[channel] = ref;
			for (let i = 0; i < npresets; i++) {
				let zptr = zref + i * 120;
				const zone = Module.HEAP16.subarray(zptr / 2, zptr / 2 + 60);
				const z = newSFZone(zone);
				const sample = getShdr(z.SampleId);
				debugger;
				if (!sampleData[z.SampleId]) {
					sampleData[z.SampleId] = await resolvePCM(
						url,
						`bytes=${sdtaStart + sample[0] * 2}-${sdtaStart + sample[1] * 2 + 1}`
					);
				}
			}

			postMessage({ preset: channels[channel] });
		}
		if (noteOn) {
			const { channel, key, vel } = noteOn;
			const zone = filterPresetZones(channel, key, vel);
		}
		if (sharePort) {
			sharePort.postMessage({ dl_table_stream: dup2.readable }, [dup2.readable]);
		}
	};

	postMessage({ srb: srb, ready: 1 });
});

function filterPresetZones(channel, key, vel) {
	const zptr = Module._malloc(120);
	Module.ccall(
		"filterForZone",
		null,
		["number", "u8", "u8", "number"],
		[channels[channel], key, vel, zptr],
		null
	);

	const zone = Module.HEAP16.subarray(zptr / 2, zptr / 2 + 60);
	zones.set(zone, 60 * channel); //.subarray(zptr, zptr + 120);
	Module._free(zptr);

	return newSFZone(zone);
}
function loadPreset(pid, bank_id) {
	let z;
	const pptr = Module.ccall("findByPid", "number", ["u16", "u16"], [pid, bank_id], null);
	return pptr;
}

importScripts("pdta.js");

async function resolvePCM(url, range) {
	const rangeHeaders = {
		headers: {
			Range: range,
		},
	};
	const pcm = new Int16Array(await (await fetch(url, rangeHeaders)).arrayBuffer());
	const fl32s = new Float32Array(pcm.length);
	for (let i = 0; i < pcm.length; i++) {
		fl32s[i] = pcm[i] / 0xffff;
	}
	return fl32s;
}
