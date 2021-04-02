// async function loadwasm(was, pages) {
//   const mem = new WebAssembly.Memory({
//     initial: pages,
//     maximum: pages,
//   });
//   const uint8 = new Uint8Array(mem.buffer);
//   const imports = {
//     env: {
//       memory: mem,
//       memoryBase: 0,
//       tableBase: 0,
//       table: new WebAssembly.Table({ initial: 0, element: 'anyfunc' }),
//       _abort: () => console.log('abort?'),
//       _grow: () => {
//         console.log('grow?');
//       },
//     },
//   };
//   const res = readFileSync(was);
//   const ab = new Uint8Array(res);
//   const module = await WebAssembly.instantiate(ab, imports);
//   return {
//     memory: uint8,
//     render: module.instance.exports['render'],
//     load: module.instance.exports.load,
//   };
// }

// async function loadsdta(url, start, length) {
//   const sdtaRange = `${start}-${start + length}`;
//   const res = await fetchWithRange(url, sdtaRange);
//   const wasm_page_size = 1024 * 56;
//   const pages = Math.ceil((length * 3 * 2) / wasm_page_size) + 50;
//   const { memory, load, render } = await loadwasm('sdta.wasm', pages);
//   const arrayBuffer = await (
//     await fetchWithRange(url, sdtaRange)
//   ).arrayBuffer();
//   let offset = 0;
//   const u8a = new Uint8Array(arrayBuffer);
//   memory.set(u8a, offset);
//   offset += u8a.byteLength;
//   const stackStart = 50 * wasm_page_size;
//   //@ts-ignore
//   load(stackStart, stackStart + length);
//   const soundCard = offset;
//   offset += 1028;
//   return {
//     bit16s: new Int16Array(memory.buffer, stackStart, length / 2).buffer,
//     data: new Uint8Array(
//       memory.buffer.slice(stackStart + length, stackStart + length + length * 2)
//     ),
//     resetSC: () => {
//       for (let i = soundCard; i < soundCard + 1028; i++) memory[offset] = 0;
//     },
//     rend: (position, end, loopStart, loopEnd, ratio, multiplier) => {
//       //@ts-ignore

//       return render(soundCard, position, loopStart, loopEnd, ratio, multiplier);
//     },
//   };
// }
