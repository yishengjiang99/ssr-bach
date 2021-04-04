import { readFile, readFileSync } from 'fs';
import { gheap } from './gheap';
import { Runtime } from './runtime';

export type SDTA = {
  nsamples: number;
  data: Float32Array;
  bit16s: Uint8Array;
  renderc: (voices: Runtime[], blockLength: number, output) => void;
};

const fs_1 = require('fs');

export async function initSDTA(data: Uint8Array) {
  const nsamples = data.byteLength / 2;
  var { heap, malloc, mem, allocStack } = gheap(nsamples * 4 + 1024 * 1024);

  const { instance } = await WebAssembly.instantiate(
    new Uint8Array(readFileSync('sdta.wasm')),
    {
      env: {
        memory: mem,
        memoryBase: 0,
        tableBase: 0,
        table: new WebAssembly.Table({ initial: 0, element: 'anyfunc' }),
        _abort: () => console.log('abort?'),
        _grow: () => {
          console.log('grow?');
        },
        consolelog: (str, b) => console.log(str, b),
      },
    }
  );
  const inputptr = malloc(nsamples * 2);
  heap.set(data, inputptr);

  const load = instance.exports['load'];
  const floffset = malloc(2 * data.byteLength);
  //@ts-ignore
  load(inputptr, floffset, nsamples);

  /**typedef struct
{
  unsigned int position, startLoop, endLoop, blocklength;
  float ratio, gainL, gainR;

} renderParams; */
  const inputParams = malloc(4 + 4 + 4 + 4 + 4 + 4 + 4);
  const resetMem = (ptr, n) => {
    for (let i = ptr; i < ptr + n; i++) heap[i] = 0x00;
  };
  function renderc(voices: Runtime[], blockLength, output) {
    const dv = new DataView(heap.buffer, inputParams, 28);
    allocStack(blockLength * 8, (stackptr) => {
      resetMem(stackptr, blockLength * 8);
      for (const v of voices) {
        const { pitch, volume, filter } = v.run(blockLength);
        const {
          iterator,
          sample: { startLoop, endLoop },
          staticLevels: {
            pan: { left, right },
          },
        } = v;

        [iterator, startLoop, endLoop, blockLength].map((v, idx) =>
          dv.setUint32(idx * 4, v, true)
        );
        [pitch, volume * left, volume * right].map((v, idx) =>
          dv.setFloat32(16 + idx * 4, v, true)
        );
        // @ts-ignore
        instance.exports['render'](stackptr, inputParams);
      }
      output.write(
        heap.slice(stackptr, blockLength * 2 * Float32Array.BYTES_PER_ELEMENT)
      );
    });
  }

  return {
    nsamples: nsamples,
    bit16s: data,
    data: new Float32Array(mem.buffer, floffset, nsamples),
    renderc,
  };
}
