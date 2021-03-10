import { spawn, execSync } from "child_process";
import { PassThrough, Readable, Writable } from "stream";
import { cspawn } from "./cspawn";
import { createWriteStream, WriteStream } from "fs";

export const lowpassFilter = (cutoff) => {
  const { stdin, stdout } = cspawn(`ffmpeg -i pipe:0 -filter:a lowpass=f=${cutoff} -`);
  return { stdin, stdout };
};
export type FfpProps = { ar?: number; ac?: number; format?: string; arg2?: string };
export const ffp = (props?: FfpProps) => {
  const { ar, ac, format, arg2 } = props || {};
  const { stdin, stderr, stdout } = spawn("ffplay", [
    "-i",
    "pipe:0",
    "-ac",
    `${ac || "2"} `,
    "-f",
    `${format || "f32le"}`,
    "-ar",
    `${ar || "48k"}`,
    `-nodisp`,
    `-loglevel`,
    "panic",
  ]);
  stderr.pipe(process.stderr);
  stdout.pipe(process.stderr);
  return stdin;
};
export const tmpOutput = (): WriteStream => {
  return createWriteStream(execSync("mktemp -u").toString());
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
