import { readFileSync } from "fs";
import { createWriteStream, readFile } from "fs";
import { convertMidi, convertMidiASAP } from "./load-sort-midi";
import { readAsCSV } from "./read-midi-sse-csv";
import { RemoteControl } from "./ssr-remote-control.types";
test("convertMidi", () => {
  const controller: RemoteControl = convertMidiASAP("./midi/song.mid");
  controller.emitter.on("note", (data) => {});
});
test("convertmidiscsv", () => {
  readAsCSV("./midi/song.mid")
    .pipe(createWriteStream("song.csv"))
    .on("end", () => {
      expect(readFileSync("./song.csv").toString().split("\n")).toHaveLength;
    });
});
