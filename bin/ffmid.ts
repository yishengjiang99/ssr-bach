#!/usr/bin/ts-node

import { convertMidi } from "../dist/load-sort-midi";
import { basename, extname } from "path";
import { createWriteStream } from "fs";
import { execSync } from "child_process";

async function run() {
  const midfile = process.argv[2];
  const output = basename(midfile).replace(extname(midfile), ".csv");
  await new Promise((resolve, reject) => {
    try {
      convertMidi(
        midfile,
        {
          output: createWriteStream(output),
          realtime: false,
        },
        resolve
      );
    } catch (e) {
      reject(e);
    }
  });
}

run();
