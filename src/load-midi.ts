import { readMidi } from './readmidi';
import { readFileSync } from 'fs';
import { Writable } from 'stream';
import { SF2File } from './sffile';
import { ffp } from './sinks';
import * as Comlink from 'comlink/dist/esm/comlink';
import nodeEndpoint from 'comlink/dist/esm/node-adapter';

async function init(sffile, midfile) {
  const worker = new Worker('./worker.mjs');
  //@ts-ignore
  const api = Comlink.wrap(nodeEndpoint(worker));
  //@ts-ignore
  console.log(api.loadSF2(sffile));
}
init('file.sf2', 'song.mid');
const midi_chan_vol_cc = 11;
const midi_mast_vol_cc = 7;
interface loadMidiProps {
  source: string;
  sff: SF2File;
  output: Writable;
  sampleRate?: number;
  debug?: boolean;
}
export function loadMidiaa(
  source: string,
  sff: SF2File,
  output: Writable,
  sampleRate: number
) {
  return loadMidi({ source, sff, output, sampleRate });
}
export function loadMidi({ source, sff, output }: loadMidiProps) {
  return loadMidiBuffer(readFileSync(source), sff, output);
}
export function loadMidiBuffer(buffer, sff, output) {
  const { tracks, tick } = readMidi(buffer, (cmd, obj) => {
    switch (cmd) {
      case 'noteOn':
        sff.rend_ctx.keyOn(obj.note, obj.vel, obj.channel);
        break;
      case 'noteOff':
        sff.rend_ctx.keyOff(obj.channel);

        break;
      case 'Program':
        sff.rend_ctx.programs[obj.channel].presetId = obj.program;
        break;
      case 'channelMode':
        switch (obj.cc) {
          case midi_chan_vol_cc:
            sff.rend_ctx.chanVols[obj.channel] = obj.val;
            break;
          case midi_mast_vol_cc:
            sff.rend_ctx.masterVol = obj.val; //[obj.channel] = obj.val;
            break;
          default:
            console.log(obj.cc, obj.val);
        }
        break;
      default:
        console.log(cmd, obj);
        break;
    }
  });
  return {
    start: () => {
      setInterval(tick, 130);
      setInterval(() => output.write(sff.rend_ctx.render(128)), 120);
    },
  };
}
