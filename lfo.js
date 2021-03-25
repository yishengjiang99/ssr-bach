(async function () {
  let memory = new WebAssembly.Memory({
    initial: 1,
    maximum: 1,
  });

  const fs = require('fs');
  const ab = new Uint8Array(fs.readFileSync('./cosine.wasm'));
  const { instance, module } = await WebAssembly.instantiate(ab, {
    env: {
      memory: memory,
      table: new WebAssembly.Table({
        initial: 1024,
        element: 'anyfunc',
      }),
      tableBase: 0,
      __table_base: 0,
      _abort: () => console.log('abort!'),
      _grow: () => memory.grow(1),
      memset: (ptr, val, size) => {
        console.log('memset');
        const bb = memory.buffer.slice(ptr, ptr + size);
        Buffer.from(bb).fill(val);
      },
    },
  });
  const HEAP8 = new Uint8Array(memory.buffer);

  console.log(instance.exports);
  instance.exports.lfo(60, 70, 122);
  console.log(new Int16Array(memory.buffer.slice(60, 122 * 2)));
  instance.exports.lfo(129, 70, 122);
  console.log(new Int16Array(memory.buffer.slice(60, 122 * 2)));
  instance.exports.lfo(60, 70, 122);
  console.log(new Int16Array(memory.buffer.slice(60, 122 * 2)));
})();
