import { startBtn, stdoutPanel } from "./misc-ui.js";
let ctx: AudioContext;
let proc: AudioWorkletNode;
const worker = new Worker("js/build/ws-worker.js", {
  type: "module",
});
const { printrx, printlink, stdout } = stdoutPanel(
  document.querySelector("#root")
);
stdout("loaded");
startBtn(async function (e) {
  e.target.disabled = true;
  e.target.innerHTML = "waiting";
  ctx = new AudioContext({ sampleRate: 48000, latencyHint: "playback" });

  if (!proc) {
    try {
      await ctx.audioWorklet.addModule("./js/build/proc2.js");
      proc = new AudioWorkletNode(ctx, "playback-processor", {
        outputChannelCount: [2],
      });
      await new Promise<void>((resolve) => {
        proc.port.onmessage = ({ data }) => {
          resolve();
        };
      });
      worker.postMessage({ port: proc.port }, [proc.port]);
      proc.connect(ctx.destination);
      printrx("u win");

      const b2 = document.createElement("button");
      b2.value = "play";
      b2.onclick = () => {
        worker.postMessage({ url: "/pcm" });
      };
      const b3 = document.createElement("button");
      b3.onclick = () => {
        worker.postMessage({ cmd: "pause" });
      };
      b3.value = "pause";
      b3.disabled = true;
      document.body.append(b2);
      document.body.append(b3);
    } catch (err) {
      alert("u wilosen");
      console.log(err);
    }
  }
});

worker.onmessage = ({ data }) => {
  //  requestAnimationFrame(() => printrx(JSON.stringify(data.stats)));
  requestAnimationFrame(() => {
    if (data.msg) stdout(data.msg);
    else if (data.stats) {
      printrx(JSON.stringify(data.stats));
    } else stdout(JSON.stringify(data));
  });
};

if (window.BroadcastChannel) {
  const rfc = new BroadcastChannel("rfc");
  rfc.onmessage = ({ data }) => {
    worker.postMessage(data);
  };
}
