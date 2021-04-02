import { readFile, readFileSync } from 'fs';
import { SF2File } from './sffile';
const wasm_page_size = 1024 * 56;

export async function initSDTA(data: Uint8Array) {
  const heapStart = 50;
  const nsamples = data.byteLength / 2;
  const mem = new WebAssembly.Memory({
    initial: (data.byteLength / wasm_page_size) * 5,
    maximum: (data.byteLength / wasm_page_size) * 5,
  });
  const heap = new Uint8Array(mem.buffer, heapStart);
  let offset = 0;
  heap.set(data, offset);
  const dataOffset = offset;
  offset += data.byteLength;
  const imports = {
    env: {
      memory: mem,
      memoryBase: 0,
      tableBase: 0,
      table: new WebAssembly.Table({ initial: 0, element: 'anyfunc' }),
      _abort: () => console.log('abort?'),
      _grow: () => {
        console.log('grow?');
      },
    },
  };

  const { instance } = await WebAssembly.instantiate(
    new Uint8Array(readFileSync('sdta.wasm')),
    imports
  );

  const load = instance.exports['load'];
  const floffset = offset + data.byteLength;
  //@ts-ignore
  load(data.byteLength / 2, offset, floffset);
  return {
    nsamples: nsamples,
    bit16s: data,
    data: heap.buffer.slice(floffset, floffset + data.byteLength * 2),
    renderc: instance.exports['render'],
  };
}
