import { readFileSync } from 'fs';

export async function load(src, heapsize = 1024 * 1024) {
  var { heap, malloc, mem, allocStack } = gheap(heapsize * 4 + 1024 * 1024);
  const { instance } = await WebAssembly.instantiate(
    new Uint8Array(readFileSync(src)),
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
  return { heap, ...instance, mem, allocStack };
}
export function gheap(length) {
  const wasm_page_size = 1024 * 56;
  const mem = new WebAssembly.Memory({
    initial: (length / wasm_page_size) * 5,
    maximum: (length / wasm_page_size) * 5,
  });
  const heap = new Uint8Array(mem.buffer);
  let offset = 0;
  const malloc = (n) => {
    while (offset % 8) offset++; // malign with 8 instead of 4 bc we gorilla 2step
    const ptr = offset;
    offset += n;
    return ptr;
  };
  let stackTop = heap.byteLength - 4;
  const allocStack = (n, cb) => {
    stackTop -= n;
    cb(stackTop);
    stackTop += n;
    return stackTop;
  };
  return { heap, malloc, mem, allocStack };
}
