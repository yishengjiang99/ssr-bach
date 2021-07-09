importScripts("libs.js");
var Module = {};

const wasmloaded = new Promise((resolve) => {
	Module.onRuntimeInitialized = function () {
		resolve(Module);
	};
});

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
	onmessage = ({ data: { setProgram, noteOn } }) => {
		if (setProgram) {
			const { channel, pid } = setProgram;
			channels[channel] = loadPreset(pid, channel == 9 ? 128 : 0);
			postMessage({ preset: pid });
		}
		if (noteOn) {
			const { channel, pid } = setProgram;
			channels[channel] = loadPreset(pid, channel == 9 ? 128 : 0);
			postMessage({ preset: 1 });
		}
	};
	postMessage({ ready: 1 });
});

function filterPresetZones(presetRef, key, vel) {
	const zptr = Module.ccall(
		"filterForZone",
		"number",
		["number", "number", "number"],
		[pptr, 66, 33],
		null
	);
	const z = Module.HEAP16.subarray(zptr / 2, zptr / 2 + 60);
}
function loadPreset(pid, bank_id) {
	let z;
	const pptr = Module.ccall("findByPid", "number", ["number", "number"], [2, 0], null);
}

importScripts("pdta.js");
