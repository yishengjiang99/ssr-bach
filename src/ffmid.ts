#!/usr/bin/ts-node

import { basename, extname } from "path";
import { createWriteStream } from "fs";
import { readAsCSV } from "./read-midi-sse-csv";
import { installNotesFromCsv } from "./install";

async function run(midfile) {
  const output = basename(midfile).replace(".mid", ".csv");
  const rs = readAsCSV(midfile, false);
  const wrcsv = createWriteStream(output);
  rs.pipe(wrcsv);
  await new Promise<void>((resolve) => {
    rs.on("data", (d) => wrcsv.write(d));
    rs.on("end", () => {
      console.log("start on csv");
      installNotesFromCsv(wrcsv.path, "FatBoy");
      resolve();
    });
  });
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
for (const f of require("fs").readdirSync("midi")) {
  try {
    run("midi/" + f);
  } catch (e) {
    require("fs").mv("midi/" + f, "junk");
  }
}
