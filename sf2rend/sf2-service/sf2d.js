//self.location.href.split("/").reverse().shift().reverse()
const pwd = self.location.href.substr(0, self.location.href.lastIndexOf("/"));
importScripts(pwd + "/libs.js");
importScripts(pwd + "/zoneProxy.js");
const url = self.location.hash.length
	? decodeURIComponent(self.location.hash.substr(1))
	: "GeneralUserGS.sf2";
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
	const sampleRegistar = new Uint32Array(srb, nchannels * bytesPerChannelZone, 400);
	const channelZones = new Int16Array(srb, 0, nchannels * 60);
	return {
		zoneInfo: (channelId) =>
			newSFZone(new Int16Array(srb.buffer, channelId * bytesPerChannelZone, 60)),
		setZoneInfo: (channelId, attrs) => {
			channelZones.set(attrs, channelId * 60);
		},
		getSampleRef: (sampleId) => sampleRegistar[sampleId],
		getSample: (sampleId) => {
			sampleId < sampleRefs - 1
				? floatrb.subarray(sampleRegistar[sampleId], sampleRegistar[sampleId + 1])
				: floatrb.subarray(sampleRegistar[sampleId]);
		},
		setSampleRef: (sampleId, ref) => (sampleRegistar[sampleId] = ref),
	};
}

const registar = sharedRegistar(srb);
const zones = new Int16Array(srb);
const sampleData = {};
let output;
//const dup2writer = dup2.writable.getWriter();

wasmloaded.then(async (Module) => {
	const { pdtaBuffer, sdtaStart } = await pdtaLoaded;
	const a = Module._malloc(pdtaBuffer.byteLength);
	Module.HEAPU8.set(pdtaBuffer, a);
	Module.ccall("loadpdta", null, ["number"], [a], null);
	const shdrref = Module.ccall("shdrref", "number", [], [], null);
	// const presetRef = Module.ccall("presetRef", "number,", [], [], null);
	// function presetZoneRef(pid, bankId) {
	// 	const refIndex = presetRef + (pid | bankId);
	// 	const zoneRef = Module.HEAPU32[refIndex];
	// 	return zoneRef;
	// }
	function getShdr(samleId) {
		const hdrRef = shdrref + samleId * 46;
		const dv = Module.HEAPU8.buffer.slice(hdrRef, hdrRef + 46);
		const [start, end, startloop, endloop, sampleRate] = new Uint32Array(dv, 20, 5);
		const [originalPitch, pitchCorrection] = new Uint8Array(dv, 20 + 5 * 4, 2);
		return [start, end, startloop, endloop, sampleRate, originalPitch, pitchCorrection];
	}

	onmessage = async ({ data: { setProgram, noteOn, readable, sharePort } }) => {
		if (setProgram) {
			const { channel, pid } = setProgram;
			const bankId = channel == 9 ? 128 : 0;
			let zref = loadPreset(pid, bankId);
			channels[channel] = zref;
			const dup2 = new TransformStream();
			(async function download() {
				for await (const download of (async function* _() {
					while (true) {
						const zone = Module.HEAP16.subarray(zref / 2, zref / 2 + 60);
						const z = newSFZone(zone);
						if (z.SampleId == -1) break;
						if (!sampleData[z.SampleId]) {
							console.log(z.SampleId);
							const sample = getShdr(z.SampleId);
							const start = sdtaStart + sample[0] * 2;
							const end = sdtaStart + sample[1] * 2 + 1;
							yield fetch(url, {
								headers: {
									Range: `bytes=` + start + `-` + end,
								},
							})
								.then((res) => res.body.pipeTo(dup2.writable, { preventClose: true }))
								.catch((e) => console.trace());
						}
						zref += 60;
					}
				})()) {
				}
			})();
			if (outlet) outlet.postMessage({ wavetable: dup2.readable }, [dup2.readable]);
			//	postMessage({ preset: channels[channel] });
		}
		if (noteOn) {
			const { channel, key, vel } = noteOn;

			const zone = filterPresetZones(channel, key, vel);
			registar.setZoneInfo(channel, zone);
		}
		if (sharePort) {
			outlet = sharePort;
			sharePort.postMessage({srb:srb});
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
	registar.setZoneInfo(channel, zone);
	//zones.set(zone, 60 * channel); //.subarray(zptr, zptr + 120);
	Module._free(zptr);

	return newSFZone(zone);
}
function loadPreset(pid, bank_id) {
	let z;
	const pptr = Module.ccall("findByPid", "number", ["u16", "u16"], [pid, bank_id], null);
	return pptr;
}

importScripts("pdta.js");
