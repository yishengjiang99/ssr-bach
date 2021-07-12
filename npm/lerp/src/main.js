const _mod = new WebAssembly.Module(wasmBinary);
const mem = new WebAssembly.Memory({
	initial: 1,
	maximum: 1,
	memoryBase: 0,
});
const lerp = new WebAssembly.Instance(_mod, {
	env: {
		memory: mem,
	},
}).exports.lerp;
