#!/usr/bin/ts-node
import { Header, Midi } from "@tonejs/midi";

import { basename, extname } from "path";
import { createWriteStream, readdirSync, readFileSync, closeSync } from "fs";
import { readAsCSV } from "./read-midi-sse-csv";
import { installNotesFromCsv } from "./install";
import { execSync } from "child_process";
import { parseMidi } from "./midi-parser";
async function run(midfile): Promise<void> {
  const csv = createWriteStream("csv/" + basename(midfile) + ".csv");
  const { header, tracks } = parseMidi(readFileSync(midfile));
  csv.write("\n" + JSON.stringify(header));
  tracks.forEach((t) => {
    t.map((e) => {
      if (e.type === "meta" || e.trackName) {
        console.log(e);
      }

      csv.write("\n" + Object.values(e).join(","));
    });
  });
  csv.end();
  // for (const tr of tracks) {
  //   for (const t of tr) {
  //     if (t.type !== "pitchBend" && t.type !== "noteOn" && t.type !== "noteOff") {
  //       console.log(t);
  //     }
  //   }
  // }

  // const output = basename(midfile).replace(".mid", ".csv");
  // const rs = readAsCSV(midfile, false);
  // const wrcsv = createWriteStream(output);
  // rs.pipe(wrcsv);
  // await new Promise<void>((resolve) => {
  //   rs.on("data", (d) => wrcsv.write(d));
  //   rs.on("end", () => {
  //     console.log("start on csv");
  //     installNotesFromCsv(wrcsv.path, "FatBoy");
  //     resolve();
  //   });
  // });
}

// let filename;
// process.argv.shift();
// while ((filename = process.argv.shift())) {
//   run(filename)
//     .then((output) => {
//       installNotesFromCsv(output, "FatBoy");
//     })
//     .catch(console.log); //.emitter.on("note", console.log);
// }
const files = readdirSync("./midi");
async function* load() {
  await require("./models").sequalize;

  for (const f of files) {
    try {
      run("midi/" + f);
      //execSync("mv ./uploads/" + f + " midi/" + f);
      yield;
    } catch (e) {
      console.log(e);
    }
  }
}

async function rsun() {
  const g = load();
  while (true) {
    const { value, done } = await g.next();
    if (done) break;
  }
}
rsun();
