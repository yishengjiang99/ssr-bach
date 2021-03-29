const fetchWithRange = (url, range) => {
  return fetch(url, {
    headers: {
      Range: 'bytes=' + range,
    },
  });
};
async function loadHeader(url) {
  const res = await fetchWithRange(url, '0-4096');
  const arb = await res.arrayBuffer();
  let offset = 0;
  const ab = new DataView(arb);
  const sdtaLength = ab.getUint32((offset += 4)) - 4;
  const sdtaStart = offset + 8;
  const pdtaStart = sdtaStart + sdtaLength;
  const pdtaLength = ab.getUint32(sdtaStart);
  return [sdtaStart, sdtaLength, pdtaStart, pdtaLength];
}
async function loadwasm(was, pages) {
  const mem = new WebAssembly.Memory({ initial: pages });
  const uint8 = new Uint8Array(mem.buffer);
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
  const res = await fetch(was);
  const ab = await res.arrayBuffer();
  const module = await WebAssembly.instantiate(ab, imports);

  return { memory: uint8, load: module.instance.exports.load };
}
export const makeFetchLoadSoundFontLikeIts1999 = (url: string) => {
  loadHeader(url).then(
    async ([sdtaStart, sdtaLength, pdtaStart, pdtaLength]) => {
      const pages = ~~(sdtaLength / 1024 / 56) * 3; //for 16bit originals and 32bit upsamples
      const budgetInflate = pages * 0.7; //100mbs.. eyeballing the math here.
      const mem = new WebAssembly.Memory({
        initial: pages + budgetInflate,
        //@ts-ignore
        shared: true,
      });
      const ff32arr = new Float32Array(mem.buffer);
      const uint8arr = new Uint8Array(mem.buffer);
      const { memory, load } = await loadwasm(
        'sdta.wasm',
        pages + budgetInflate
      );
      const inputPtr = 1024;
      const floatPtr = 1024 + sdtaLength;
      (async () => {
        const sdtaRange = `${sdtaStart}-${sdtaStart + sdtaLength}`;
        const res = await fetchWithRange(url, sdtaRange);
        let inputPtr = 1024;
        const r = res.body.getReader();
        while (true) {
          const { done, value } = await r.read();
          if (done) break;
          memory.set(value, inputPtr);
          inputPtr += value.length;
        }
      })();
      //@ts-ignore;
      load(inputPtr, floatPtr);
      const flt = new Float32Array(memory, floatPtr, sdtaLength * 2);
    }
  );
};
