import { spawn } from "child_process";
import { Readable, Writable } from "stream";
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
