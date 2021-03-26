import { ffp } from './sinks';
import * as Comlink from 'comlink/dist/esm/comlink.js';
import nodeEndpoint from 'comlink/dist/esm/node-adapter';

async function init(sffile, midfile) {
  const worker = new Worker('./worker.mjs');
  //@ts-ignore
  const api = Comlink.wrap(nodeEndpoint(worker));
  //@ts-ignore
  console.log(api.loadSF2(sffile));
}
init('file.sf2', 'song.mid');
