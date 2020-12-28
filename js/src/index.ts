import { stdoutPanel, cdiv } from "./misc-ui.js";

const { rx1, stdout } = stdoutPanel(document.querySelector("header"));
stdout("loaded");
const worker = new Worker("./js/wsworker.js", { type: "module" });
worker.onmessage = ({ data }) => {
  console.log("s");
  stdout(data);
};
let ctx: AudioContext;
let proc: AudioWorkletNode;

document.querySelectorAll("a").forEach((element) => {
  element.addEventListener("click", async (e) => {
    e.preventDefault();
    if (!ctx)
      ctx =
        element.dataset.samplerate && element.dataset.sampleRate === "44100"
          ? new AudioContext({ sampleRate: 44100, latencyHint: "playback" })
          : new AudioContext({ sampleRate: 48000, latencyHint: "playback" });
    if (ctx.state !== "running") await ctx.resume();

    if (!proc) {
      await ctx.audioWorklet.addModule("./js/proc.js");
      proc = new AudioWorkletNode(ctx, "playback-processor", {
        outputChannelCount: [2],
      });
      await new Promise<void>((resolve) => {
        proc.port.onmessage = ({ data }) => {
          stdout(data.msg);
          resolve();
        };
      });
      worker.postMessage({ port: proc.port }, [proc.port]);

      proc.connect(ctx.destination);
    }

    if (element.classList.contains("mocha")) {
      worker.postMessage({ url: element.href });
    }
    worker.onmessage = ({ data }) => {
      console.log(data);
    };
  });
});
