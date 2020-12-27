#!/usr/bin/ts-node

import { basename, extname } from "path";
import { createWriteStream } from "fs";
import { readAsCSV } from "../dist/read-midi-sse-csv";
import { installNotesFromCsv } from "../dist/install";

async function run(midfile) {
  const output = basename(midfile).replace(".mid", ".csv");
  const rs = readAsCSV(midfile, false);
  const wrcsv = createWriteStream(output);
  rs.pipe(wrcsv);
  await new Promise<void>((resolve) => {
    rs.on("data", (d) => wrcsv.write(d));
    rs.on("end", () => {
      console.log("start on csv");
      installNotesFromCsv(output, "FatBoy");
      resolve();
    });
  });
}

run("./song.mid")
  .then((output) => {
    installNotesFromCsv(output, "FatBoy");
  })
  .catch(console.log); //.emitter.on("note", console.log);
