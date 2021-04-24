import { SF2File, SFZone } from '../node_modules/parse-sf2/dist/index.js';
import { centtime2sec } from './math.js';

// Create AudioContext and buffer source

export function resolveBuffer(
  ctx: BaseAudioContext,
  sffile: SF2File,
  z: SFZone,
  key: number
): AudioBufferSourceNode {
  const ab = new AudioBuffer({
    numberOfChannels: 1,
    length: z.sample.end - z.sample.start,
    sampleRate: ctx.sampleRate,
  });
  const fl = new Float32Array(z.sample.end - z.sample.start);
  const u8s = sffile.sdta.data;
  const dv = new DataView(
    u8s.buffer,
    z.sample.start * 2,
    z.sample.end * 2 - z.sample.start * 2
  );

  for (
    let offset = 0;
    offset < 2 * z.sample.end - 2 * z.sample.start - 2;
    offset++
  ) {
    const int = dv.getInt16(offset * 2, true);
    fl[offset] = int / 0x7fff;
  }

  ab.copyToChannel(fl, 0);
  const absn = new AudioBufferSourceNode(ctx, {
    buffer: ab,
    playbackRate: centtime2sec(key * 100 - z.pitch - z.scaleTuning * key),
  });

  return absn;
}

export class InputStream {
  private _iterator!: Iterable<number>;
  public get iterator(): Iterable<number> {
    return this._iterator;
  }
  public set iterator(value: Iterable<number>) {
    this._iterator = value;
  }

  scriptNode: ScriptProcessorNode;
  constructor(ctx: BaseAudioContext) {
    this.scriptNode = ctx.createScriptProcessor(256, 1, 1);
    let that = this;
    this.scriptNode.onaudioprocess = function ({ inputBuffer, outputBuffer }) {
      if (!that.iterator || that.iterator.next().done) return;
      const outputc = outputBuffer.getChannelData(0);
      for (let i = 0; i < outputc.length; i++) {
        outputc[i++] = that.iterator.next().value;
      }
    };
  }
}
