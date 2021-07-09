importScripts("libs.js");
var Module = {};
let u8f;

const wasmloaded = new Promise((resolve) => {
	Module.onRuntimeInitialized = function () {
		resolve(Module);
	};
});
const srb = new SharedArrayBuffer(16 * 1024 * 8);
u8f = new Uint8Array(srb);
postMessage({ srb: srb });
const pdtaLoaded = new Promise((resolve) => {
	addEventListener(
		"message",
		function ({ data: { pdtaBuffer } }) {
			if (pdtaBuffer) {
				resolve(pdtaBuffer);
			}
		},
		{ once: true }
	);
});
//const sf2loaded = sfbkstream(self.location.hash.substr(1));
const channels = new Array(17);
wasmloaded.then(async (Module) => {
	const pdtaBuffer = await pdtaLoaded;
	const a = Module._malloc(pdtaBuffer.byteLength);
	Module.HEAPU8.set(pdtaBuffer, a);
	Module.ccall("loadpdta", null, ["number"], [a], null);
	onmessage = ({ data: { setProgram, noteOn, readable } }) => {
		if (setProgram) {
			const { channel, pid } = setProgram;
			channels[channel] = loadPreset(pid, channel == 9 ? 128 : 0);
			postMessage({ preset: pid });
		}
		if (noteOn) {
			const { channel, key, vel } = noteOn;
			const pset = filterPresetZones(channel, key, vel);
		}
		if (readable) {
		}
	};
	postMessage({ ready: 1 });
});

function filterPresetZones(channel, key, vel) {
	const zptr = Module.ccall(
		"filterForZone",
		"number",
		["number", "number", "number"],
		[channels[channel], key, vel],
		null
	);
	for (let i = zptr; i < zptr + 120; i++) {
		u8f[120 * channel + i] = Module.HEAPU8[i];
	}
	postMessage({ updated: [120 * channel, 120] });
	return zptr;
}
function loadPreset(pid, bank_id) {
	let z;
	const pptr = Module.ccall("findByPid", "number", ["number", "number"], [2, 0], null);
	return pptr;
}

importScripts("pdta.js");
