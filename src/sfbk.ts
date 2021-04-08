import * as pdta_1 from './pdta.js';
import { readAB } from './aba.js';
import { SFZone, sf_gen_id, Shdr } from './Zone.js';
import { resolve } from 'node:path';
import { IBag } from './pdta.types.js';
import { PDTA } from './pdta.js';
import { std_inst_names } from './utilv1.js';
import { Runtime } from './runtime.js';

export async function initsfbk(url: string) {
  const arr = new Uint8Array(
    await (
      await fetch(url, { mode: 'no-cors', headers: { Range: 'bytes=0-6400' } })
    ).arrayBuffer()
  );

  const r = readAB(arr);
  const [riff, filesize, sig, list] = [
    r.readNString(4),
    r.get32(),
    r.readNString(4),
    r.readNString(4),
  ];
  console.assert(riff == 'RIFF' && sig == 'sfbk');

  const infosize = r.get32();
  console.log(r.readNString(4), r.offset);
  console.log(infosize, r.offset);
  r.skip(infosize - 4);
  console.assert(r.readNString(4) == 'LIST');
  const sdtaSize = r.get32();
  const stdstart = r.offset + 8;
  const pdtastart = stdstart + sdtaSize;
  const sdtawait = fetch(url, {
    mode: 'no-cors',
    headers: {
      Range: 'bytes=' + stdstart + '-' + pdtastart,
    },
  })
    .then((res) => res.arrayBuffer())
    .then((ab) => {
      const uint16 = new Uint16Array(ab);
      const floats = new Float32Array(uint16.length);

      for (let i = 0; i < uint16.length; i++) {
        const int = uint16[i];
        // If the high bit is on, then it is a negative number, and actually counts backwards.
        const float = int >= 0x8000 ? -(0x10000 - int) / 0x8000 : int / 0x7fff;
        // interleave
        floats[i] = float; //(n = ++n % 2)][!n ? j++ : j - 1] = float;
      }
      return floats;
    });
  const parr = new Uint8Array(
    await (
      await fetch(url, {
        headers: { Range: 'bytes=' + pdtastart + '-' },
      })
    ).arrayBuffer()
  );
  const pr = readAB(parr);
  console.log(pr.readNString(4));
  const pdta = new pdta_1.PDTA(pr);
  return {
    pdta,
    sdtaWait: sdtawait,
    getSample,
    renderZone: async (
      z: SFZone,
      _key: number,
      _velocity: number,
      ctx: AudioContext
    ) => {
      const g = new GainNode(ctx, { gain: 0.2 });
      const src = getSample(
        pdta.shdr[z.sampleID],
        await sdtawait
      ).audioBufferSrc(ctx);
      src.connect(g).connect(ctx.destination);

      function keyon() {
        g.gain.linearRampToValueAtTime(
          2,
          Math.pow(2, z.volEnv.phases.attack / 1200)
        );

        src.start();
      }
      function keyoff() {
        g.gain.cancelScheduledValues(0);
        g.gain.exponentialRampToValueAtTime(0.0001, z.volEnv.phases.release);
        src.stop(33);
      }
      return { keyon, keyoff };
    },
  };
}
export function WAVheader(n: number, channel: number): Uint8Array {
  const buffer = new Uint8Array(44);
  const view = new DataView(buffer.buffer);
  function writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
  /* RIFF identifier */
  writeString(view, 0, 'RIFF');
  /* RIFF chunk length */
  view.setUint32(4, 36 + n * 4, true);
  /* RIFF type */
  writeString(view, 8, 'WAVE');
  /* format chunk identifier */
  writeString(view, 12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw) */
  view.setUint16(20, 0x0003, true);
  /* channel count */
  view.setUint16(22, 1, true);
  /* sample rate */
  view.setUint32(24, 48000, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, 48000 * 8, true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, channel * 8, true);
  /* bits per sample */
  view.setUint16(34, 32, true);
  /* data chunk identifier */
  writeString(view, 36, 'data');
  /* data chunk length */
  view.setUint32(40, n * 8, true);

  return buffer;
}

export function getSample(
  shr: Shdr,
  sdta: Float32Array
): {
  data: Float32Array;
  audioBufferSrc: (ctx: AudioContext) => AudioBufferSourceNode;
  wav: ReadableStream;
  loop: [number, number];
  shift: any;
} {
  const { start, end } = shr;
  const data = sdta.subarray(start, end);

  const loop = [shr.startLoop - shr.start, shr.endLoop - shr.start];
  return {
    loop,
    audioBufferSrc: (ctx) => {
      const myArrayBuffer = ctx.createBuffer(
        1,
        3 * ctx.sampleRate,
        ctx.sampleRate
      );
      myArrayBuffer.copyToChannel(data, 0);
      // ab.copyToChannel(sample, 0); // (0) = sample;
      return new AudioBufferSourceNode(ctx, {
        buffer: myArrayBuffer,
        loop: true,

        loopEnd: loop[0],
        loopStart: loop[1],
      });
    },
    shift: function* (pitchRatio = 1) {
      let pos = 0;
      while (true) {
        pos = pos + pitchRatio;
        if (pos >= loop[1]) pos = loop[0];
        yield data[pos];
      }
    },
    data,
    get wav() {
      return new Blob([
        WAVheader(length, 1).buffer,
        sdta.subarray(start, end),
      ]).stream();
    },
  };
}
export function getSampleIzones(sid: number, pdta: PDTA): SFZone[] {
  return pdta.ibag
    .filter((ib) => ib.izone.sampleID == sid)
    .map((ib) => ib.izone);
}
