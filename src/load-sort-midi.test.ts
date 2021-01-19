import { readFileSync } from "fs";
import { createWriteStream, readFile } from "fs";
import { convertMidi, convertMidiASAP } from "./load-sort-midi";
import { readAsCSV } from "./read-midi-sse-csv";
import { RemoteControl } from "./ssr-remote-control.types";
test("convertMidi read from .mid and emit notes, tempo, meta, time", (done) => {
  const controller: RemoteControl = convertMidiASAP("./midi/song.mid");
  let notes=0;
  controller.emitter.on("note", (note) => {
    expect(Object.keys(note)).toContain('midi');
    notes++;
  });
  controller.emitter.once("end", () => {
      expect(notes ).toBeGreaterThan(1000);
  });
});

// test("convertmidiscsv", () => {
//   readAsCSV("./midi/song.mid")
//     .pipe(createWriteStream("song.csv"))
//     .on("end", () => {
//       expect(readFileSync("./song.csv").toString().split("\n")).toHaveLength;
//     });
// });

