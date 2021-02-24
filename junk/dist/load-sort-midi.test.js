"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const midi_1 = require("@tonejs/midi");
const fs_1 = require("fs");
const load_sort_midi_1 = require("./load-sort-midi");
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
const controller = load_sort_midi_1.convertMidiASAP("./midi/song.mid");
fs_1.readdirSync("./midi").map((f) => {
    const t = new midi_1.Midi(fs_1.readFileSync("./midi/" + f)).tracks.filter((t) => t.channel === 9);
    if (t.length && t[0].instrument)
        console.log(t[0].instrument);
});
//console.log(t);
