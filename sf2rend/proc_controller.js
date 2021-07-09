export async function load_proc_controller(ctx, url, stdout, stderr) {
	await ctx.audioWorklet.addModule("renderctx.js");
	const proc = new AudioWorkletNode(ctx, "rend-proc", {
		outputChannelCount: [2],
	});
	//	proc.port.postMessage(sdtaStream, [sdtaStream]);
	proc.port.onmessageerror = stderr;
	proc.port.onmessage = (e) => stdout(e.data);
	return {
		proc,
	};
}
function fetch_sf2_xml(url) {
	return new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		xhr.open("GET", url, true);
		const t = document.querySelector("#sflist");
		xhr.responseType = "document";
		xhr.onload = function () {
			if ((pr = xhr.responseXML)) {
				const doc = xhr.responseXML.documentElement;
				resolve(doc);
			}
		};
		xhr.onerror = reject;
		xhr.send();
	});
}
