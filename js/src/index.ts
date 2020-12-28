import { stdoutPanel, cdiv } from "./misc-ui.js";

const { printrx, printlink, stdout } = stdoutPanel(
  document.querySelector("header")
);
stdout("loaded");

const main = document.querySelector("main");
const worker = new Worker("./js/ws-worker.js", { type: "module" });
worker.onmessage = ({ data }) => {
  //  requestAnimationFrame(() => printrx(JSON.stringify(data.stats)));
  requestAnimationFrame(() => {
    if (data.msg) printrx(data.msg);
    if (data.stats) {
      printrx(JSON.stringify(data.stats));
    }
    if (data.link) {
      stdout(`<a href='${data.link}'>${data.note}</a>`); /// + " " + data.name);
    }
  });
};
let ctx: AudioContext;
let proc: AudioWorkletNode;
const menu = document.querySelector("table");

const conso = document.createElement("input");
conso.type = "text";
conso.onkeydown = (e) => {
  if (e.key === "enter") {
    worker.postMessage({ cmd: conso.value });
    conso.value = "";
  }
};
document.body.ondblclick = () => worker.postMessage({ cmd: "stop" });
document.body.append(conso);
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
      await ctx.audioWorklet.addModule("./js/proc2.js");
      proc = new AudioWorkletNode(ctx, "playback-processor", {
        outputChannelCount: [1],
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
  });
});
