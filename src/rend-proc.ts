import { Runtime } from './runtime.js';
import { getSample } from './sfbk.js';
const sampleRate = 48000;
//@ts-ignore
class RenderProcessor extends AudioWorkletProcessor {
  staging: any[];
  production: any[];
  port: any;
  samples: Float32Array;
  startTime: any;
  constructor(options) {
    super();
    this.staging = [];
    this.production = new Array(16);
    this.port.onmessage = (e) => {
      const { samples, zone, note } = e.data;
      if (samples) {
        this.samples = samples;
      }
      if (zone && note) {
        const { start, channelId } = note;
        const rt = new Runtime(zone, {
          key: note.midi,
          velocity: note.velocity,
          channel: channelId,
        });

        this.staging.push({
          channelId,
          note,
          rt,
          sampleData: getSample(zone.sample, this.samples),
          shift: 0.0,
          get startFrame() {
            if (this.startTime == null) return false;
            return (start - this.startTime) / sampleRate;
          },
        });

        if (this.staging.length > 5) {
          this.startTime = globalThis.currentTime;
          this.port.postMessage({ ready: 1 });
        }
      }
    };
  }

  process(inputs, outputs, parameters) {
    while (this.staging[0]?.startFrame < globalThis.currentFrame + 128) {
      const v = this.staging.shift();
      v.preroll = ~~(v.startFrame - globalThis.currentFrame);
      this.production[v.channelId] = v;
    }
    for (let vid = 0; vid < 17; vid++) {
      if (!this.production[vid]) continue;
      const v = this.production[vid];
      let { preroll } = v;
      //    const rootkey =v.rt.zone.rootKey >-1 ?v.rt.zone.rootKey :v.rt.zone.sample.originalPitch;
      const { pitch, volume } = v.rt.run(128);

      const pan = v.rt.staticLevels.pan;
      const looper = v.rt.sample.endLoop - v.rt.sample.startLoop;
      for (let offset = 0; offset < 128; offset++) {
        let newval;
        if (preroll-- > 0) {
          newval = 0;
          continue;
        } else {
          newval = v.sampleData[v.rt.iterator];
        }
        newval = newval * volume;
        outputs[0][0][offset] += newval * pan.left;
        outputs[0][1][offset] += newval * pan.right;
        v.shift = v.shift + pitch;

        while (v.shift >= 1) {
          v.rt.iterator++;
          v.shift--;
        }
        if (v.iterator >= v.rt.sample.endLoop) {
          v.rt.iterator = v.iterator - looper;
        }
      }
    }
    return true;
  }
}
// @ts-ignore
registerProcessor('rend-proc', RenderProcessor);
