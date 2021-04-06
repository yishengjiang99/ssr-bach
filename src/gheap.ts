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
