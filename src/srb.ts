import { Runtime } from './runtime.js';
import { SFZone } from './Zone.js';
const sampleRate = 48000;
class RenderProcessor {
  production: any[];
  port: any;
  samples: DataView;
  floats: DataView;
  staging: any;
  constructor(options) {
    this.production = new Array(16); //=[]
    this.port.onmessage = (e: {
      data: {
        samples: Uint8Array;
        zone: SFZone;
        channelId: number;
        note: {
          midi: number;
          velocity: number;
          durationTime: number;
          start: number;
          channelId: number;
          time: number;
        };
      };
    }) => {
      const { samples, zone, note } = e.data;
      if (samples) {
        const c = new DataView(samples);
        const nsamples = this.samples.byteLength / Int16Array.BYTES_PER_ELEMENT;
        this.samples = new DataView(
          new Uint8Array(nsamples * Float32Array.BYTES_PER_ELEMENT)
        );
        for (let i = 0; i < nsamples; i++) {
          this.samples.setFloat32(
            i * 4,
            c.getInt16(i * 2, true) / 0xffff,
            true
          );
        }
      }

      if (zone && note) {
        const { start, channelId } = note;
        const rt = new Runtime(zone, {
          key: note.midi,
          velocity: note.velocity,
          channel: channelId,
        });
        rt.mods.ampVol.triggerRelease();
        this.staging.push({
          channelId,
          note,
          rt: rt,
          startFrame: start * sampleRate,
          iterator: 0,
          shift: 0.0,
        });
      }
    };
  }

  process(inputs, outputs, parameters) {
    let currentFrame = globalThis.currentFrame;
    // || 0;
    while (this.staging[0].startFrame < currentFrame + 128) {
      const v = this.staging.shift();
      this.production[v.id] = v;
      v.preroll = v.startFrame - currentFrame;
    }

    for (let vid = 0; vid < 16; vid++) {
      let { preroll, rt, iterator, shift } = this.production[vid];
      const { volume, pitch, filter } = rt.run(128);
      const pan = rt.staticLevels.pan;
      const looper = rt.sample.endLoop - rt.sample.startLoop;
      for (let offset = 0; offset < 128; offset++) {
        if (preroll > offset) {
          offset = preroll;
          this.production[vid].preroll = 0;
          continue;
        }
        while (this.production[vid].shift >= 1) {
          this.production[vid].iterator++;
          this.production[vid].shift--;
        }
        const newval = this.samples[this.production[vid].iterator] * volume;
        outputs[0][0][offset] += newval * pan.left;
        outputs[0][1][offset] += newval * pan.right;

        if (this.production[vid].iterator >= rt.sample.endLoop) {
          this.production[vid].iterator -= looper;
        }
        this.production[vid].shift += pitch;
      }
    }
    return true;
  }
}
