import { Midi } from "@tonejs/midi";
import { Instrument } from "@tonejs/midi/dist/Instrument";
import { writeFileSync } from "fs";
import { devnull, ffp } from "./sinks";
import { loadMidi, loadMidi2 } from "./load-midi";
import { SF2File } from "./sffile";
import test from "ava";
import { Channel, Zone } from "./sf.types";

test("loading notes", (t) => {
  const sffile = new SF2File("./file.sf2"); //.ts");
  const midi = new Midi();
  midi.addTrack();
  midi.tracks[0].addNote({
    midi: 60,
    time: 0,
    duration: 0.2,
  });
  writeFileSync("1.mid", Buffer.from(midi.toArray()));

  const { tracks, loop } = loadMidi2({
    source: "./1.mid",
    sff: sffile,
    output: devnull(),
    sampleRate: 48000,
    debug: true,
  });
  loop();
  t.pass();
});

test("fast vs slow", (t) => {
  const sffile = new SF2File("./file.sf2"); //.ts");
  const midi = new Midi();
  midi.addTrack();
  midi.tracks[0].addNote({
    midi: 60,
    time: 0,
    duration: 0.4,
    velocity: 0.99,
  });
  midi.tracks[0].addNote({
    midi: 62,
    time: 0.45,
    duration: 0.4,
    velocity: 0.1,
  });
  writeFileSync("fvs.mid", Buffer.from(midi.toArray()));

  const { tracks, loop } = loadMidi2({
    source: "./fvs.mid",
    sff: sffile,
    output: ffp(),
    sampleRate: 48000,
  });

  loop();
  t.pass();
});
