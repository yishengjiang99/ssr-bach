import { ChildProcess, spawn } from 'child_process';
import { Readable, Writable } from 'stream';
export function cspawn(
  str,
  pipes: { p0?: Readable; p2?: Writable; p1?: Writable } = {}
): ChildProcess {
  let t = str.split(' ');
  const { p0, p1, p2 } = pipes;
  const cp = spawn(t.shift(), t);
  const { stdin, stdout, stderr } = cp;
  if (p0) {
    p0.pipe(stdin);
  }
  if (p1) stdout.pipe(p1);
  if (p2) stderr.pipe(p2);
  stdout.on('error', (e) => {
    //console.log(e.toString());
  });
  return cp;
}
