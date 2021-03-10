import { initGain } from "./initGain.js";
let ctx: AudioContext,
  gainNode: GainNode,
  av: AnalyserNode,
  slider: HTMLInputElement,
  proc: AudioWorkletNode;
export async function initCtx() {
  if (!ctx) {
    ctx = new AudioContext({ sampleRate: 48000, latencyHint: "playback" });
    await ctx.audioWorklet.addModule("/js/build/proc2.js");
    [gainNode, slider] = initGain(ctx);
    av = new AnalyserNode(ctx);
    gainNode.connect(av).connect(ctx.destination);
  }
  return { ctx, gainNode, slider, av };
}
