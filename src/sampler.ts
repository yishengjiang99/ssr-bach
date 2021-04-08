import { initsfbk, getSample, getSampleIzones } from './sfbk.js';
import { Runtime } from './runtime.js';
import { keys88 } from './utilv1.js';
import { Shdr } from './Zone.js';
import { PDTA } from './pdta.js';
import { range } from './Utils.js';

let _pdta: any, _sdtaWait: any, sampl: any;
async function init() {
  main(await initsfbk('file.sf2'));
}
interface getSampleInterface {
  data: Float32Array;
  audioBufferSrc: (ctx: AudioContext) => AudioBufferSourceNode;
  wav: ReadableStream<Uint8Array>;
  loop: [number, number];
  shift: Generator<number, number, never>;
}

export function main(sfbk: {
  pdta: PDTA;
  sdtaWait?: Promise<Float32Array>;
  getSample?: (shr: Shdr, sdta: Float32Array) => getSampleInterface;
  renderZone?: (
    instname: string,
    _key: number,
    _velocity: number,
    ctx: AudioContext
  ) => Promise<{ keyon: () => void; keyoff: () => void }>;
  findInstId?: any;
}): Promise<void> {
  // await init();

  let ctx = new AudioContext();
  const div = document.querySelector('#mocha');

  for (const pid of ['oboe', 'trumpet', 'clarinet', 'cello'].map((name) =>
    sfbk.pdta.phdr
      .filter((p) => p.bankId == 0 && p.name.toLowerCase().includes(name))
      .map((p) => p.presetId)
  )[0]) {
    for (const key of keys88.keys()) {
      const { keyon, keyoff } = sfbk.pdta
        .findPreset(pid, 0, key, 88)
        .zones[0].map((zz) => sfbk.renderZone(zz, key, 76, ctx));
      div.appendChild(
        h('button', {
          onmousedown: (e) => {
            keyon();
            e.target.addEventListener('mouseup', keyoff, { once: true });
          },
        })
      );
    }
  }
}
init();
