import { readAB } from './aba.js';
import { SFZone, Shdr } from './Zone.js';
import { PDTA } from './pdta.js';
import { resolve } from 'node:path';

interface SFBKRet {
  pdta: PDTA;
  sdtaWait: Promise<Float32Array>;
}

export async function initsfbk(
  url: string,
  port?: MessagePort
): Promise<SFBKRet> {
  const ab = await (
    await fetch(url, { mode: 'no-cors', headers: { Range: 'bytes=0-6400' } })
  ).arrayBuffer();
  const infosection = new Uint8Array(ab);

  const r = readAB(infosection);
  const [riff, filesize, sig, list] = [
    r.readNString(4),
    r.get32(),
    r.readNString(4),
    r.readNString(4),
  ];
  console.assert(riff == 'RIFF' && sig == 'sfbk');

  const infosize = r.get32();
  console.log(r.readNString(4), filesize, list, r.offset);
  console.log(infosize, r.offset);
  r.skip(infosize - 4);
  console.assert(r.readNString(4) == 'LIST');
  const sdtaSize = r.get32();
  const stdstart = r.offset + 8;
  const pdtastart = stdstart + sdtaSize;
  const sdtaWait = fetch(url, {
    mode: 'no-cors',
    headers: {
      Range: 'bytes=' + stdstart + '-' + pdtastart,
    },
  }).then(async (res) => {
    const nsamples = res.headers.has('Content-Length')
      ? parseInt(res.headers.get('Content-Length')) / 2
      : (pdtastart - stdstart) / 2;
    const floats = new Float32Array(nsamples);
    if (res.body.getReader) {
      let offset = 0;
      const reader = res.body.getReader();
      reader.read().then(function process({ done, value }) {
        if (done) return;
        for (let i = 0; i < value.length; i += 2) {
          const int = value[i] | (value[i + 1] << 8);
          floats[offset++] =
            int >= 0x8000 ? -(0x10000 - int) / 0x8000 : int / 0x7fff;
        }
        port && port.postMessage({ prog: [offset, nsamples] });
        reader.read().then(process);
      });
      return floats;
    } else {
      const uint16 = new Uint16Array(await res.arrayBuffer());
      const floats = new Float32Array(uint16.length);

      for (let i = 0; i < uint16.length; i++) {
        const int = uint16[i];
        // If the high bit is on, then it is a negative number, and actually counts backwards.
        const float = int >= 0x8000 ? -(0x10000 - int) / 0x8000 : int / 0x7fff;
        // interleave
        floats[i] = float; //(n = ++n % 2)][!n ? j++ : j - 1] = float;
      }
      return floats;
    }
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
  const pdta = new PDTA(pr);

  return {
    pdta,
    sdtaWait,
  };
}
export function getSampleIzones(sid: number, pdta: PDTA): SFZone[] {
  return pdta.ibag
    .filter((ib) => ib.izone.sampleID == sid)
    .map((ib) => ib.izone);
}

export interface IGetSample {
  data: Float32Array;
  audioBufferSrc: (ctx: AudioContext) => AudioBufferSourceNode;
  loop: number[];
  shift: Generator<number, void, unknown>;
}

export function getSample(shr: Shdr, sdta: Float32Array): IGetSample {
  const { start, end } = shr;
  const data = sdta.subarray(start, end);

  const loop = [shr.startLoop - shr.start, shr.endLoop - shr.start];
  function* shift(pitchRatio = 1) {
    let pos = 0;
    while (true) {
      pos = pos + pitchRatio;
      if (pos >= loop[1]) pos = loop[0];
      yield data[pos];
    }
  }
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
    shift: shift(),
    data,
  };
}
