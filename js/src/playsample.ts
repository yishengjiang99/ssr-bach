// import { AnalyzerView } from './analyserView';

let ctx, proc;

const playsample = async function (url) {
	const { readable, writable } = new TransformStream();

	fetch(url).then(resp => resp.body.pipeTo(writable))
	if (!ctx)
	{
		ctx = new AudioContext({ sampleRate: 48000, latencyHint: "playback" });
		await ctx.audioWorklet.addModule("/js/build/proc2.js");
		proc = new AudioWorkletNode(ctx, "playback-processor", {
			outputChannelCount: [2],
		});
	}
	proc.port.postMessage({ readable }, [readable]);

}


