import { convertMidi } from "./load-sort-midi";
import { basename, extname, resolve } from "path";
import { execSync } from "child_process";
import { readdir } from "fs";

export function list(resp) {
  const set = new Set(execSync("ls csv/*csv").toString().split(/s+/));

  readdir(resolve(__dirname, "..", "midis"), (err, results) => {
    if (err) resp.end(err.message);
    resp.send(JSON.stringify(results));
  });
}
