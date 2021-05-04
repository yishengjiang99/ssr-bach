WebAssembly.instantiateStreaming(fetch("adsr.c.wasm"), {
	env: {
		table: new WebAssembly.Table({ initial: 1, element: "anyfunc" }),
		memory: new WebAssembly.Memory({ initial: 1, maximum: 1 }),
		fmax: (a, b) => Math.max(a, b),
	},
})
	.then((res) => {
		debugger;
		console.log(res);
		return (res.instance.exports.newEnvelope as CallableFunction)(-333, 1222, 122, 54, 944);
	})
	.then((env) => {
		debugger;
	})
	.catch((e) => {
		console.log(e);
	});
