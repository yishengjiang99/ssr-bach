import { spawn } from "child_process";
import { PassThrough, Readable, Writable } from "stream";
import { cspawn } from "./utils";
export const ffp = () => {
  const { stdin, stderr, stdout } = spawn("ffplay", [
    "-i",
    "pipe:0",
    "-ac",
    "2",
    "-f",
    "f32le",
    "-ar",
    "48000",
  ]);
  stderr.pipe(process.stderr);
  stdout.pipe(process.stderr);
  return stdin;
};
export const nc80 = (port) => {
  return cspawn(`nc -l ${port}`).stdin;
};
export const devnull = () => {
  return new PassThrough();
};
export const mp3c = (): [Writable, Readable, Readable] => {
  const { stdin, stderr, stdout } = spawn("ffmpeg", [
    "-loglevel",
    "debug",
    "-i",
    "pipe:0",
    "-ac",
    "2",
    "-f",
    "f32le",
    "-ar",
    "48000",
    "-acodec",
    "copy",
    "-",
  ]);
  stderr.pipe(process.stderr);

  return [stdin, stdout, stderr];
};
