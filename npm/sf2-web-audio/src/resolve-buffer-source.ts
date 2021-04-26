export interface IGetSample {
	data: Float32Array;
	audioBufferSrc: (ctx: AudioContext) => AudioBufferSourceNode;
	loop: number[];
	shift: Generator<number, void, unknown>;
}

export function getSample(shr: any, sdta: Float32Array): AudioBufferSourceNode {
	const { start, end } = shr;
	const data = sdta.subarray(start, end);

	const loop = [shr.startLoop - shr.start, shr.endLoop - shr.start];
	function* shift(pitchRatio = 1) {
		let pos = 0;
		while (true) {
			pos = pos + pitchRatio;
			if (pos >= loop[1]) pos = loop[0];
			yield data[pos];
		}
	}
	return {
		loop,
		audioBufferSrc: (ctx) => {
			const myArrayBuffer = ctx.createBuffer(1, 3 * ctx.sampleRate, ctx.sampleRate);
			myArrayBuffer.copyToChannel(data, 0);
			// ab.copyToChannel(sample, 0); // (0) = sample;
			return new AudioBufferSourceNode(ctx, {
				buffer: myArrayBuffer,
				loop: true,

				loopEnd: loop[0],
				loopStart: loop[1],
			});
		},
		shift: shift(),
		data,
	};
}
