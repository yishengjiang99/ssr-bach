let proc, ctx;
async function playPCM(url) {
  ctx = new AudioContext();
  ctx.audioWorklet
    .addModule("proc5.js")
    .then(() => {
      proc = new AudioWorkletNode(ctx, "proc5", {
        outputChannelCount: [2],
      });
      debugger;
      proc.onprocessorerror = (e) => alert(e.message);
      proc.connect(ctx.destination);
      worker.postMessage({ url: window.location.href + url, port: proc.port }, [
        proc.port,
      ]);

      return proc;
    })
    .catch((e) => {
      alert(e.message);
    });
}

const worker = new Worker(
  URL.createObjectURL(
    new Blob([workerjs()], {
      type: "application/javascript",
    })
  )
);

function workerjs() {
  return `onmessage = async ({ data: { port, url } }) => {
			const transform = new TransformStream();
			(async () => {
				debugger;
			const resp = await fetch(url);
			resp.body.pipeTo(transform.writable, { preventClose: true });
			})();
			port.postMessage({ url, readable: transform.readable }, [transform.readable]);
		};`;
}
