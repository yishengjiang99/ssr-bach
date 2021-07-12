const pro = new WebAssembly.Module(wasmBinary);
const mem = new WebAssembly.Memory({
	initial: 1, //100 x 64k ..just putting in some safe values now
	maximum: 1,
});
const instance = new WebAssembly.Instance(pro, {
	env: {
		memory: mem,
		console_log: (str, v) => console.log(str, v),
		table: new WebAssembly.Table({ element: "anyfunc", initial: 6 }),
		powf: (b, exp) => Math.pow(b, exp),
	},
});
let sbrk = 0;
const mempool = [];
while (sbrk < 0xffff - 24) {
	mempool.push(sbrk);
	sbrk += 24;
}
export function envelope(att, decay, release, sustain, sr) {
	if (mempool.length == 0) {
		alert("banned. please gc some envelope refs");
		return;
	}
	const pt = mempool.shift();
	instance.exports.newEnvelope(pt, att, decay, release, sustain, sr);

	return {
		shift: () => instance.exports.envShift(pt),
		release: () => instance.exports.adsrReleaes(pt),
		free: () => mempool.push(pt),
		info: () => {
			const [
				att_steps,
				decay_steps,
				release_steps,
				sustain,
				db_attenuate,
				att_rate,
				decay_rate,
				release_rate,
			] = [...new Uint32Array(mem.buffer, pt, 4), ...new Float32Array(mem.buffer, pt + 16, 4)];
			return {
				att_steps,
				decay_steps,
				release_steps,
				sustain,
				db_attenuate,
				att_rate,
				decay_rate,
				release_rate,
			};
		},
	};
}
