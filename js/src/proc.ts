// import { SharedStats } from "./SharedStats.js"; //("./js/SharedStats.js");

// const frame = 36;
const silence = new Float32Array(128 * 2);
silence.fill(0);
const chunk = 1024;
/* @ts-ignore */
class PlaybackProcessor extends AudioWorkletProcessor {
  sbr: SharedArrayBuffer;
  flt: Float32Array;
  rptr: number = 0;
  looped: number = 0;
  port: MessagePort;
  stateBuffer: Uint32Array;

  constructor() {
    super();
    // this.sharedStats = new SharedStats();

    this.port.postMessage({ msg: "initialized" });
    this.looped = 0;

    this.port.onmessage = ({ data: { sbr, loop } }) => {
      if (sbr) {
        this.flt = new Float32Array(sbr, 64);
        this.stateBuffer = new Uint32Array(sbr, 0, 2);
        this.stateBuffer[1] = 0;
      }
      if (loop) {
        this.looped++;
      }
    };
  }
  getAB() {
    if (this.stateBuffer[1] >= this.stateBuffer[0] && this.looped) {
      return silence;
    }
    const ret = this.flt.subarray(this.stateBuffer[1], 128 * 2);
    this.stateBuffer[1] += 128 * 2 * 4;
    if (this.rptr >= this.flt.byteLength) {
      this.looped--;
      this.rptr = 0;
    }
    return ret;
  }
  get started(): boolean {
    return this.stateBuffer[0] !== 0;
  }
  process(inputs, outputs: Float32Array[][], parameters) {
    if (!this.started) return true;

    const fl = this.getAB();
    let sum = 0;
    for (let i = 0; i < 128; i++) {
      for (let ch = 0; ch < 2; ch++) {
        outputs[0][ch][i] = fl[i * 2 + ch];
      }
    }
    return true;
  }
}
// @ts-ignore
registerProcessor("playback-processor", PlaybackProcessor);
