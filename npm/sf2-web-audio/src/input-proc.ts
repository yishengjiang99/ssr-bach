// prettier-ignore
const wasmBinary = new Uint8Array([
  0, 97, 115, 109, 1, 0, 0, 0, 1, 146, 128, 128, 128, 0, 3, 96, 3, 125, 125, 125, 1, 125, 96, 1, 127, 1, 125, 96, 1, 125, 1, 125, 2, 143, 128, 128, 128, 0, 1, 3, 101, 110, 118, 6, 109, 101, 109, 111, 114, 121, 2, 0, 1, 3, 132, 128, 128, 128, 0, 3, 0, 1, 2, 4, 132, 128, 128, 128, 0, 1, 112, 0, 0, 7, 163, 128, 128, 128, 0, 3, 4, 108, 101, 114, 112, 0, 0, 11, 112, 111, 119, 50, 111, 118, 101, 114, 49, 50, 100, 0, 1, 10, 112, 111, 119, 50, 111, 118, 101, 114, 49, 50, 0, 2, 9, 129, 128, 128, 128, 0, 0, 10, 225, 130, 128, 128, 0, 3, 183, 128, 128, 128, 0, 1, 1, 127, 2, 125, 65, 0, 40, 2, 4, 65, 16, 107, 34, 3, 32, 0, 56, 2, 12, 32, 3, 32, 1, 56, 2, 8, 32, 3, 32, 2, 56, 2, 4, 32, 3, 42, 2, 12, 34, 1, 32, 2, 32, 3, 42, 2, 8, 32, 1, 147, 148, 146, 11, 11, 202, 129, 128, 128, 0, 2, 1, 127, 1, 125, 2, 125, 65, 0, 40, 2, 4, 65, 16, 107, 34, 1, 32, 0, 54, 2, 12, 32, 1, 65, 128, 128, 128, 252, 3, 54, 2, 8, 2, 64, 3, 64, 32, 1, 40, 2, 12, 65, 13, 72, 13, 1, 32, 1, 32, 1, 42, 2, 8, 34, 2, 32, 2, 146, 56, 2, 8, 32, 1, 32, 1, 40, 2, 12, 65, 116, 106, 54, 2, 12, 12, 0, 11, 0, 11, 2, 64, 3, 64, 32, 1, 40, 2, 12, 65, 115, 74, 13, 1, 32, 1, 32, 1, 42, 2, 8, 67, 0, 0, 64, 65, 149, 56, 2, 8, 32, 1, 32, 1, 40, 2, 12, 65, 12, 106, 54, 2, 12, 12, 0, 11, 0, 11, 2, 64, 32, 1, 40, 2, 12, 65, 0, 72, 13, 0, 32, 1, 32, 1, 42, 2, 8, 32, 1, 40, 2, 12, 65, 2, 116, 65, 16, 106, 42, 2, 0, 148, 34, 2, 56, 2, 8, 32, 2, 15, 11, 32, 1, 32, 1, 42, 2, 8, 65, 16, 32, 1, 40, 2, 12, 65, 2, 116, 107, 42, 2, 0, 149, 34, 2, 56, 2, 8, 32, 2, 11, 11, 208, 128, 128, 128, 0, 2, 1, 127, 1, 125, 2, 125, 65, 0, 65, 0, 40, 2, 4, 65, 16, 107, 34, 1, 54, 2, 4, 32, 1, 32, 0, 56, 2, 12, 32, 0, 67, 0, 0, 200, 66, 148, 168, 16, 1, 33, 0, 32, 1, 42, 2, 12, 34, 2, 32, 2, 67, 0, 0, 200, 66, 148, 147, 168, 16, 1, 33, 2, 65, 0, 32, 1, 65, 16, 106, 54, 2, 4, 32, 0, 32, 2, 148, 11, 11, 11, 191, 128, 128, 128, 0, 2, 0, 65, 4, 11, 4, 80, 39, 0, 0, 0, 65, 16, 11, 48, 0, 0, 128, 63, 125, 156, 135, 63, 214, 172, 143, 63, 240, 55, 152, 63, 24, 69, 161, 63, 8, 220, 170, 63, 243, 4, 181, 63, 135, 200, 191, 63, 245, 47, 203, 63, 253, 68, 215, 63, 240, 17, 228, 63, 191, 161, 241, 63
]);
const _mod = new WebAssembly.Module(wasmBinary);
const mem = new WebAssembly.Memory({
	initial: 1,
	maximum: 1,
});
const { lerp, pow2over12 } = new WebAssembly.Instance(_mod, {
	env: {
		memory: mem,
	},
}).exports;

declare type IteratorParams = {
	loop: number[];
	frac: number;
	start: number;
	pos: number;
};
type MsgType = {
	sdtaF32s: SharedArrayBuffer;
	channel: number;
	statebuff: SharedArrayBuffer;
	iteratorParams: IteratorParams;
};

// @ts-ignore
class MyAudioProcessor extends AudioWorkletProcessor {
	iterators: IteratorParams[] = [];
	port: any;
	sdtaF32s: Float32Array | null | undefined;
	statebuff: Uint8Array | undefined;

	static get parameterDescriptors() {
		return [
			{
				name: "egVal",
				defaultValue: 0,
				minValue: -20000,
				maxValue: 30909,
				automationRate: "a-rate",
			},
			{
				name: "pitchShift",
				defaultValue: 0,
				minValue: -20000,
				maxValue: 30909,
				automationRate: "a-rate",
			},
		];
	}

	//@ts-ignore
	constructor({ numberOfOutputs }) {
		super();
		// @ts-ignore
		this.port.onmessage = this.msghandler.bind(this);
	}
	msghandler({ data: { iteratorParams, statebuff, sdtaF32s } }: { data: MsgType }) {
		if (statebuff && sdtaF32s) {
			this.sdtaF32s = new Float32Array(sdtaF32s);
			this.statebuff = new Uint8Array(statebuff);
			this.statebuff[0] = 1;
			this.port.postMessage({ ready: 1 });
		}
		if (iteratorParams) {
			this.iterators.push(iteratorParams);
			if (this.statebuff) this.statebuff[0] += 2;
		}
	}

	process(_: Float32Array[][], outputList: Float32Array[][], parameters: AudioParamList) {
		//@ts-ignore
		const currentFrame: number = globalThis.currentFrame;
		if (!this.sdtaF32s || !this.statebuff) return true;
		this.iterators.forEach((iterator) => {
			if (iterator.start > currentFrame) return;
			const pitchShift = parameters["pitchShift"];
			const egVal = parameters["egVal"];
			function modAmp(val: number, i: number) {
				if (egVal.length == outputList[0][0].length) {
					return val * egVal[i];
				} else {
					return val * egVal[0];
				}
			}
			function modFrag(frag: number, i: number) {
				if (pitchShift.length == outputList[0][0].length) {
					return frag + pitchShift[i];
				} else {
					return frag + pitchShift[0];
				}
			}
			if (pitchShift[0] == 0) return true;
			//  if (this.iterators.start == -1) return true;
			for (let i = 0; i < outputList[0][0].length; i++) {
				// @ts-ignore
				const v1 = lerp(
					this.sdtaF32s![iterator.pos],
					this.sdtaF32s![iterator.pos + 1],
					iterator.frac
				);
				outputList[0][0][i] = modAmp(v1, i);
				outputList[0][1][i] = modAmp(v1, i);
				iterator.frac = modFrag(iterator.frac, i);
				while (iterator.frac >= 1) {
					iterator.frac--;
					iterator.pos++;
				}
				if (iterator.pos >= iterator.loop[1]) {
					iterator.pos -= iterator.loop[1] - iterator.loop[0] + 1;
				}
			}
			//	return true;
		});
		return true;
	}
}
// @ts-ignore
registerProcessor("input-proc", MyAudioProcessor);
