export const wsm = async (path: string): Promise<any> => {
  // const memory = new WebAssembly.Memory({ initial: 256 });
  // @ts-ignore
  let memory = new WebAssembly.Memory({
    initial: 10,
    maximum: 100,
    // @ts-ignore
    shared: true,
  });

  const res = await fetch("path");

  const ab = await res.arrayBuffer();

  const { instance } = await WebAssembly.instantiate(new Uint8Array(ab), {
    env: {
      memory: memory,
      table: new WebAssembly.Table({
        initial: 1024 * 256,
        element: "anyfunc",
      }),
      memcpy: () => {},
      tableBase: 0,
      _abort: console.log,
      _grow: (a) => console.log(a, "gg"),
      __table_base: 0,
    },
  });

  const HEAP8 = new Uint8Array(memory.buffer);
  const HEAP32 = new Uint32Array(memory.buffer);
  //@ts-ignore
  return {
    HEAP8,
    HEAP32,
    ...instance.exports,
  };
};

export const fishwasm = wsm("./fish.wasm");
