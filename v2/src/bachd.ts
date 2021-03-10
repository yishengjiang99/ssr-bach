import { PassThrough } from "stream";
import { cspawn } from "./cspawn";
import { loadMidi } from "./load-midi";
import { SF2File } from "./sffile";
import { ffp, lowpassFilter } from "./sinks";
const pt = new PassThrough();
const { tracks, loop } = loadMidi({
  source: "midi/song.mid", //1.mid",
  sff: new SF2File("file.sf2", 24000),
  output: cspawn("ffplay -f f32le -ac 2 -ar 24000 -i pipe:0").stdin,
  sampleRate: 24000,
});
loop();
