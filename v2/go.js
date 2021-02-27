const { instance, module } = await WebAssembly.instantiate(ab, {
    env: {
        memory: memory,
        table: new WebAssembly.Table({
            initial: 1024,
            element: "anyfunc",
        }),
        tableBase: 0,
        __table_base: 0,
        _abort: () => console.log("abort!"),
        _grow: () => memory.grow(1),
        memset: (ptr, val, size) => {
            const bb = memory.buffer.slice(ptr, ptr + size);
            Buffer.from(bb).fill(val);
        },
        pow: optimizedPow,
        powf: optimizedPow,
    },
});