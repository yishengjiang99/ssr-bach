import { SF2File } from "./sffile";
import { loadMidi } from "./load-midi";
import { resolve } from "path";
import { ffp } from "./ffp";

const { loop, tracks } = loadMidi(
  process.argv[2] || "./song.mid",
  new SF2File(process.argv[3] || "./file.sf2", 24000),
  ffp({ ac: 2, ar: 24000 }),
  24000
);
loop(32);
