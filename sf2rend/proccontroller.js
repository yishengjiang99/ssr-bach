import { sfbkstream, PDTA } from "https://unpkg.com/parse-sf2@2.1.2/bundle.js";
import { readAB } from "https://unpkg.com/parse-sf2@2.1.2/dist/aba.js";
export async function load_proc_controller(ctx, url, stderr, stdout) {
	const workletjoin = ctx.audioWorklet.addModule("rendctx.js");
	const { pdtaBuffer, sdtaStream, nsamples, infos } = await sfbkstream(url);
	const pdta = new PDTA(readAB(pdtaBuffer));
	await workletjoin;
	const proc = new AudioWorkletNode(ctx, "rend-proc", {
		outputChannelCount: [2],
	});
	proc.port.postMessage(sdtaStream, [sdtaStream]);
	proc.port.onmessageerror = stderr;
	proc.port.onmessage = stdout;
	return {
		proc,
		pdta,
	};
}
