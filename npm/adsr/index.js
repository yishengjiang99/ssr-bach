import Module from "./build/adsr.js";
const env = Module.newEnvelope(1200, 1200, 1200, 11, 48000);
const egvals = new Float32Array(128);
for (let i = 0; i < 128; i++) {
	egvals[i] = Module.envShift(env);
}

postMessage({ egval: egvals });
