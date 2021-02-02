import { spawn } from "child_process";

export function cspawn(
  str,
  { debug }: { debug: boolean } = { debug: false }
): { stdout; stdin; stderr } {
  let t = str.split(" ");

  const { stdin, stdout, stderr } = spawn(t.shift(), t);
  if (debug) {
    stdout.on("error", (e) => console.log(e.toString(), str));
    stderr.pipe(process.stderr);
  }
  return { stdin, stdout, stderr };
}
