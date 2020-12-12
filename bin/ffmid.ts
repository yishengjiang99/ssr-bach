#!/usr/bin/local/ts-node
import { convertMidi } from "../dist/load-sort-midi";
import { basename, extname } from "path";
import { createWriteStream } from "fs";
import { execSync } from "child_process";

const midfile = process.argv[1];
convertMidi(midfile, {
  output: createWriteStream(
    "csv/" + basename(midfile).replace(extname(midfile), "csv")
  ),
  realtime: false,
});
