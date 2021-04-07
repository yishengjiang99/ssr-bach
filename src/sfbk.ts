import * as pdta_1 from './pdta.js';
import { readAB } from './aba.js';

export async function initsfbk(url) {
  const arr = new Uint8Array(
    await (
      await fetch(url, { mode: 'no-cors', headers: { Range: 'bytes=0-6400' } })
    ).arrayBuffer()
  );

  const r = readAB(arr);
  const [riff, filesize, sig, list] = [
    r.readNString(4),
    r.get32(),
    r.readNString(4),
    r.readNString(4),
  ];
  console.assert(riff == 'RIFF' && sig == 'sfbk');

  let infosize = r.get32();
  console.log(r.readNString(4), r.offset);
  console.log(infosize, r.offset);
  let infoStart = r.offset;
  r.skip(infosize - 4);
  console.assert(r.readNString(4) == 'LIST');
  const sdtaSize = r.get32();
  const stdstart = r.offset + 8;
  const pdtastart = stdstart + sdtaSize;
  const worker = new Worker('dist/worker.js', { type: 'module' });
  worker.postMessage({
    sdta: {
      url,
      range: [stdstart, pdtastart],
    },
  });
  const parr = new Uint8Array(
    await (
      await fetch(url, {
        headers: { Range: 'bytes=' + pdtastart + '-' },
      })
    ).arrayBuffer()
  );
  const pr = readAB(parr);
  console.log(pr.readNString(4));
  return {
    pdta: new pdta_1.PDTA(pr),
    workerWait: new Promise((resolve) => {
      worker.addEventListener('message', ({ data: { init } }) => {
        if (init == 1) {
          resolve(worker);
        }
      });
    }),
  };
}
