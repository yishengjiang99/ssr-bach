import { Midi } from "@tonejs/midi";
import { readdir, readdirSync, readFileSync } from "fs";
import { createWriteStream, readFile } from "fs";
import { convertMidi, convertMidiASAP } from "./load-sort-midi";
import { readAsCSV } from "./read-midi-sse-csv";
import { RemoteControl } from "./ssr-remote-control.types";
// test("convertMidi read from .mid and emit notes, tempo, meta, time", (done) => {
//   const controller: RemoteControl = convertMidiASAP("./midi/song.mid");
//   let notes = 0;
//   controller.emitter.on("note", (note) => {
//     expect(Object.keys(note)).toContain("midi");
//     notes++;
//   });
//   controller.emitter.once("end", () => {
//     expect(notes).toBeGreaterThan(1000);
//   });
// });

// test("drums state ", () => {
//   const controller: RemoteControl = convertMidiASAP("./midi/song.mid");
//   const t = new Midi(readFileSync("./midi/billie.mid")).tracks[9];
//   console.log(t);
// });
// test("convertmidiscsv", () => {
//   readAsCSV("./midi/song.mid")
//     .pipe(createWriteStream("song.csv"))
//     .on("end", () => {
//       expect(readFileSync("./song.csv").toString().split("\n")).toHaveLength;
//     });
// });
const controller: RemoteControl = convertMidiASAP("./midi/song.mid");
readdirSync("./midi").map((f) => {
  const t = new Midi(readFileSync("./midi/" + f)).tracks.filter((t) => t.channel === 9);

  if (t.length && t[0].instrument) console.log(t[0].instrument);
});
//console.log(t);
