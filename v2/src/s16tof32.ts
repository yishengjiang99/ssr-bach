import { ffp } from "./sinks";
import { loadMidi2 } from "./load-midi";
import { SF2File } from "./sffile";

const { tracks, loop } = loadMidi2({
  source: "./song.mid",
  sff: new SF2File("file.sf2"),
  output: ffp({ arg2: "-nodisp -loglevel panic" }),
  sampleRate: 48000,
  debug: false,
});
loop();
