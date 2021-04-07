import { RingBuffer } from '../nodep/dist/rb.js';
import { Runtime } from './runtime.js';
export async function load(src, heapsize = 1024 * 1024) {
  var { heap, malloc, exports, mem } = await gheap(
    heapsize * 4 + 1024 * 1024,
    new Uint8Array(await (await fetch(src, { mode: 'no-cors' })).arrayBuffer())
  );

  return { heap, malloc, exports, mem };
}
export async function gheap(length: number, wasmbin: BufferSource) {
  const heap_start = 68;
  const wasm_page_size = 1024 * 56;
  const pages = Math.ceil((length / wasm_page_size) * 5 + 10240);
  const mem = new WebAssembly.Memory({
    initial: pages,
    maximum: pages,
    //@ts-ignore
    shared: true,
  });
  const heap = new Uint8Array(mem.buffer, heap_start);
  let offset = 0;
  const malloc = (n: number) => {
    while (offset % 8) offset++; // malign with 8 instead of 4 bc we gorilla 2step
    const ptr = offset;
    offset += n;
    return ptr;
  };

  const config = {
    env: {
      memory: mem,
      table: new WebAssembly.Table({ initial: 0, element: 'anyfunc' }),
      _abort: () => console.log('abort?'),
      _grow: () => {
        console.log('grow?');
      },
      consolelog: (str: any, b: any) => console.log(str, b),
    },
  };
  const {
    instance: { exports },
  } = await WebAssembly.instantiate(wasmbin, config);

  return { heap, malloc, mem, exports };
}

export async function initSDTA(
  arr: Uint8Array,
  { blockLength, sampleRate } = { blockLength: 128, sampleRate: 128 }
) {
  const bin = await (
    await fetch('../sdta.wasm', {
      mode: 'no-cors',
    })
  ).arrayBuffer();
  const { heap, malloc, exports } = await gheap(arr.byteLength, bin);
  const nsamples = arr.byteLength / 2;

  const inputptr = malloc(arr.byteLength + 20);
  heap.set(arr, inputptr);

  const floffset = malloc(2 * arr.byteLength + 20);
  console.log(inputptr, floffset);
  // @ts-ignore
  exports['load'](inputptr, floffset, nsamples);

  const inputParams = [];
  for (let i = 0; i < 18; i++) {
    inputParams.push(malloc(36));
  } //[=.map((chid) => {
  const rb = new RingBuffer(malloc, {
    sr: sampleRate,
    blocks: 30,
    blockLength: blockLength,
  });

  function* render(rt: Runtime, noteStartTime: number, channelId: number) {
    const dv = new DataView(heap.buffer, inputParams[channelId], 28);

    const { start, startLoop, endLoop } = rt.sample;
    let position = start;

    [position, startLoop, endLoop, blockLength].map((v, idx) =>
      dv.setUint32(idx * 4, v, true)
    );
    const writeIter = rb.writeIterator(noteStartTime, rt.length);
    const pan = rt.staticLevels.pan;
    const { volume, pitch, filter } = rt.run(blockLength);
    [pitch, volume * pan.left, volume * pan.right].map((v, idx) =>
      dv.setFloat32(16 + idx * 4, v, true)
    );
    let nextPtr = writeIter.next();
    while (true) {
      const { done, value } = writeIter.next();
      if (done) break;
      if (value) {
        //@ts-ignore
        exports['render'](floffset, inputParams[channelId], value);
      }
    }
  }
  return { render, heap, soundCard: rb, floats: floffset };
}
