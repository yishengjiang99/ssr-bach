import { SF2File } from "./sffile";
import { loadMidi } from "./load-midi";
const { loop, tracks } = loadMidi(
  process.argv[2] || "./song.mid",
  new SF2File(process.argv[3] || "file.sf2", 24000),
  process.stdout,
  24000
);
loop();
