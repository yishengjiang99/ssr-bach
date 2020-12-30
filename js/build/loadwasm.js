export const wsm = async () => {
    // const memory = new WebAssembly.Memory({ initial: 256 });
    // @ts-ignore
    let memory = new WebAssembly.Memory({
        initial: 10,
        maximum: 100,
        // @ts-ignore
        shared: true,
    });
    const res = await fetch("../fifo.wasm");
    const ab = await res.arrayBuffer();
    const { instance } = await WebAssembly.instantiate(new Uint8Array(ab), {
        module: {
            fifo: console.log,
        },
        env: {
            memory: memory,
            table: new WebAssembly.Table({
                initial: 1024 * 256,
                element: "anyfunc",
            }),
            memcpy: () => { },
            tableBase: 0,
            _abort: console.log,
            _grow: (a) => console.log(a, "gg"),
            __table_base: 0,
        },
    });
    const { fifo, fifo_init, fifo_read, fifo_write, fifo_size, } = instance.exports;
    const HEAP8 = new Uint8Array(memory.buffer);
    const HEAP32 = new Uint32Array(memory.buffer);
    //@ts-ignore
    return {
        HEAP8,
        HEAP32,
        fifo,
        fifo_init,
        fifo_read,
        fifo_write,
        fifo_size,
    };
};
