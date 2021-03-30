import { readMidi } from "./readmidi";
import { readFileSync } from "fs";
import { Writable } from "stream";
import { SF2File } from "./sffile";
import { ffp } from "./sinks";
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
      case "noteOn":
        sff.rend_ctx.keyOn(obj.note, obj.vel, 0.5, obj.channel);
        break;
      case "noteOff":
        sff.rend_ctx.keyOff(obj.channel, 0.5);

        break;
      case "Program":
        sff.rend_ctx.programs[obj.channel].presetId = obj.program;
        break;
      case "channelMode":
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
      setInterval(tick, 500);
      setInterval(() => output.write(sff.rend_ctx.render(128)), 120);
    },
  };
}
loadMidiaa("./midi/song.mid", new SF2File("./sf2/file.sf2"), ffp(), 48000).start();
