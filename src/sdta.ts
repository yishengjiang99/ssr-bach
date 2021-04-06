export async function load(src, heapsize = 1024 * 1024) {
  var { heap, malloc, exports, mem, allocStack } = await gheap(
    heapsize * 4 + 1024 * 1024,
    new Uint8Array(await (await fetch(src)).arrayBuffer())
  );

  return { heap, malloc, exports, mem, allocStack };
}
export async function gheap(length: number, wasmbin: BufferSource) {
  const heap_start = 68;
  const wasm_page_size = 1024 * 56;
  const pages = Math.ceil((length / wasm_page_size) * 5 + 10240);
  const mem = new WebAssembly.Memory({
    initial: pages,
    maximum: pages,
  });
  const heap = new Uint8Array(mem.buffer, heap_start);
  let offset = heap_start;
  const malloc = (n: number) => {
    while (offset % 8) offset++; // malign with 8 instead of 4 bc we gorilla 2step
    const ptr = offset;
    offset += n;
    return ptr;
  };
  let stackTop = heap.byteLength - 4;
  const allocStack = (n: number, cb: (arg0: number) => void) => {
    stackTop -= n;
    cb(stackTop);
    stackTop += n;
    return stackTop;
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
  const inputParams = malloc(4 + 4 + 4 + 4 + 4 + 4 + 4);

  return { heap, inputParams, malloc, mem, allocStack, exports };
}

export function* ringbuf(blockSize, malloc) {
  let obOffset = 0;
  const soundCard = malloc(10 * blockSize);
  while (true) {
    yield soundCard + obOffset;
    if (obOffset >= 9 * blockSize) {
      obOffset = 0;
    } else {
      obOffset += blockSize;
    }
  }
}

export async function initSDTA(
  arr: Uint8Array,
  { blockLength, sampleRate } = { blockLength: 128, sampleRate: 128 }
) {
  const bin = await (await fetch('sdta.wasm')).arrayBuffer();
  const { heap, malloc, inputParams, exports } = await gheap(
    arr.byteLength,
    bin
  );
  const nsamples = arr.byteLength / 2;

  const inputptr = malloc(arr.byteLength + 20);
  heap.set(arr, inputptr);

  const floffset = malloc(2 * arr.byteLength + 20);
  console.log(inputptr, floffset);
  // @ts-ignore
  exports['load'](inputptr, floffset, nsamples);
  const dv = new DataView(heap.buffer, inputParams, 28);
  const rb = ringbuf(blockLength, malloc);
  function render(
    blockLength: any,
    { iterator, start, end, startLoop, endLoop }: any,
    { pitch, volume, pan }: any
  ) {
    [iterator, startLoop, endLoop, blockLength].map((v, idx) =>
      dv.setUint32(idx * 4, v, true)
    );
    [pitch, volume * pan.left, volume * pan.right].map((v, idx) =>
      dv.setFloat32(16 + idx * 4, v, true)
    );
    const out = rb.next().value;
    //@ts-ignore
    exports['render'](floats, inputParams, out);

    return new Uint8Array(heap, out, blockLength * 8);
  }
  return { render };
}
