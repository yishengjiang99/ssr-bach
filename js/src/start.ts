import { AnalyzerView } from "./analyserView.js";
import { logtime, stdout } from "./misc-ui.js";

export const worker = new Worker("/js/build/fetchworker.js", {
  type: "module",
});

import { initGain } from "./initGain.js";
import { EventsPanel } from "./panel.js";

let ctx: AudioContext,
  gainNode: GainNode,
  av: AnalyserNode,
  slider: HTMLInputElement,
  proc: AudioWorkletNode;

export default (async function (midifile: string) {
  const timelogger = logtime(stdout);
  timelogger("user init - clicked");
  const panel = new EventsPanel();

  if (!ctx) await initCtx();
  if (proc) disconnectExistingProc(proc);

  try {
    proc = new AudioWorkletNode(ctx, "playback-processor", {
      outputChannelCount: [2],
    });
    timelogger(" client  load");
    proc.connect(gainNode);
    worker.postMessage({ port: proc.port, url: "/pcm/" + midifile }, [proc.port]);

    drawCanvasNextTickStart();
    panel.start("/rt/" + midifile);
  } catch (e) {
    stdout("<font color='red'>" + e.message + "</font>");
  }
});

async function initCtx() {
  ctx = new AudioContext({ sampleRate: 48000, latencyHint: "playback" });
  await ctx.audioWorklet.addModule("/js/build/proc2.js");
  [gainNode, slider] = initGain(ctx);
  av = new AnalyserNode(ctx);
  gainNode.connect(av).connect(ctx.destination);
  return { ctx, gainNode, slider, av };
}

function drawCanvasNextTickStart() {
  const avcanvas = AnalyzerView(av);
  setTimeout(() => avcanvas.start(), 400);
}
function disconnectExistingProc(proc) {
  if (proc) {
    proc.disconnect();
    proc.port.onmessage = null;
    proc = null;
  }
}
