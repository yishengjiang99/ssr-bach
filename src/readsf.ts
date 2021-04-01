import { readAB } from './aba';

import { PDTA } from './pdta';
import fetch from 'node-fetch';
import { readFileSync } from 'fs';
const fetchWithRange = (url, r) =>
  fetch(url, { headers: { range: 'bytes=' + r } });
export const fetchSoundFont = async (url) => {
  const [sdtaStart, sdtaLength, pdtaStart] = await loadHeader(url);
  console.log(sdtaStart, sdtaLength, pdtaStart);
  const rb = await (await fetchWithRange(url, pdtaStart + '-')).arrayBuffer();

  const pdta = new PDTA(readAB(rb));

  const sdta = await loadsdta(url, sdtaStart, sdtaLength);
  return {
    pdta,
    sdta,
  };
};
async function loadHeader(url) {
  const res = await fetchWithRange(url, '0-5000');
  const arb = await res.arrayBuffer();
  const r = readAB(arb);
  const { readNString, get32 } = r;

  const [riff, filesize, sfbk, list, infosize] = [
    readNString(4),
    get32(),
    readNString(4),
    readNString(4),
    get32(),
  ];

  r.skip(infosize);
  // r.offset += infosize + 4; //skoip to pdta and get its size
  const list2 = readNString(4);

  const sdtaByteLength = get32();
  console.log(readNString(4));
  const smplStartByte = r.getOffset();
  const pdtaStartByte = smplStartByte + sdtaByteLength + 8; //skip
  console.log(pdtaStartByte);
  return [smplStartByte, sdtaByteLength, pdtaStartByte];
}
async function loadwasm(was, pages) {
  const mem = new WebAssembly.Memory({
    initial: pages,
    maximum: pages,
  });
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
  const res = readFileSync(was);
  const ab = new Uint8Array(res);
  const module = await WebAssembly.instantiate(ab, imports);
  return {
    memory: uint8,
    render: module.instance.exports['render'],
    load: module.instance.exports.load,
  };
}

async function loadsdta(url, start, length) {
  const sdtaRange = `${start}-${start + length}`;
  const res = await fetchWithRange(url, sdtaRange);
  const wasm_page_size = 1024 * 56;
  const pages = Math.ceil((length * 3 * 2) / wasm_page_size) + 50;
  const { memory, load, render } = await loadwasm('sdta.wasm', pages);
  const arrayBuffer = await (
    await fetchWithRange(url, sdtaRange)
  ).arrayBuffer();
  let offset = 0;
  const u8a = new Uint8Array(arrayBuffer);
  memory.set(u8a, offset);
  offset += u8a.byteLength;
  const stackStart = 50 * wasm_page_size;
  //@ts-ignore
  load(stackStart, stackStart + length);
  const soundCard = offset;
  offset += 1028;
  return {
    bit16s: new Int16Array(memory.buffer, stackStart, length / 2).buffer,
    data: new Uint8Array(
      memory.buffer.slice(stackStart + length, stackStart + length + length * 2)
    ),
    resetSC: () => {
      for (let i = soundCard; i < soundCard + 1028; i++) memory[offset] = 0;
    },
    rend: (position, end, loopStart, loopEnd, ratio, multiplier) => {
      //@ts-ignore

      return render(soundCard, position, loopStart, loopEnd, ratio, multiplier);
    },
  };
}
