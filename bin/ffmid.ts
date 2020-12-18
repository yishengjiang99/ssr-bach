#!/usr/bin/ts-node

import { basename, extname } from "path";
import { createWriteStream } from "fs";
import { readAsCSV } from "../dist/read-midi-sse-csv";
import { installNotesFromCsv } from "../dist/install";
async function run(midfile) {
  const output = basename(midfile).replace(extname(midfile), ".csv");
  await new Promise((resolve, reject) => {
    try {
      readAsCSV(midfile, false)
        .pipe(createWriteStream(output))
        .on("end", resolve);
    } catch (e) {
      reject(e);
    }
  });
  installNotesFromCsv(output);
}

if (process.argv[2]) {
  run(process.argv[2]);
}
