type Ptr = number;
export interface GrepFIFO {
  HEAP8: Uint8Array;
  HEAP32: Uint32Array;
  fifo_init: any;
  fifo_read: any;
  fifo_write: any;
  fifo_size: any;
  fifo: any;
}
export const wsm = (): Promise<GrepFIFO | void> => {
  const memory = new WebAssembly.Memory({ initial: 256 });

  const env = {
    memory: memory.buffer,
    memoryBase: 0,
    __memory_base: 0,
    table: new WebAssembly.Table({
      initial: 1024 * 30,
      element: "anyfunc",
    }),
    tableBase: 0,
    __table_base: 0,
  };

  return fetch("./fifo.wasm")
    .then((res) => res.arrayBuffer())
    .then((ab) =>
      WebAssembly.instantiate(new Uint8Array(ab), {
        module: {
          fifo: console.log,
        },
        env: {
          memory: new WebAssembly.Memory({ initial: 256 }),
          memoryBase: 0,
          __memory_base: 0,
          table: new WebAssembly.Table({
            initial: 1024 * 30,
            element: "anyfunc",
          }),
          memcpy: () => {},
          tableBase: 0,
          _abort: console.log,
          _grow: () => alert("hii"),
          __table_base: 0,
        },
      })
    )
    .then(({ instance }) => {
      const HEAP8 = new Uint8Array(memory.buffer);
      const HEAP32 = new Uint32Array(memory.buffer);

      const {
        fifo_init,
        fifo_read,
        fifo_write,
        fifo_size,
        fifo,
      } = instance.exports;

      return {
        HEAP8,
        HEAP32,
        fifo_init,
        fifo_read,
        fifo_write,
        fifo_size,
        fifo,
      };
    })
    .catch(alert);
};
