import { convertMidi } from "./load-sort-midi";
import { basename, extname } from "path";
import { createWriteStream } from "fs";
import { execSync } from "child_process";

export function list() {
  execSync("ls mid/*mid");
  execSync("ls csv/*csv");
}

export async function mkcsv(midfile) {
  await new Promise((resolve) =>
    convertMidi(
      midfile,
      {
        realtime: false,
        output: createWriteStream(
          "csv/" + basename(midfile).replace(extname(midfile), "csv")
        ),
      },
      resolve
    )
  );
}
mkcsv("midi/chpn_op7_2-mid.mid");
