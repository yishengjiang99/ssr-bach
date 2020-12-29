import { spawn } from "child_process";
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
export const mp3c = () => {
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
  stdout.pipe(process.stderr);
  return stdin;
};
export const toRStP = (path: string, host: string = "localhost:8554") => {
  const { stdin, stdout, stderr } = cspawn(
    `ffmpeg -re -stream_loop -1 -f f32le -ac 2 -ar 48000 -i pipe:0 -f WAV -f rtsp rtsp://${host}/${path}`
  );
  stderr.pipe(process.stderr);
  stdout.pipe(process.stderr);
  return stdin;
};
//produce("./song.mid", toRStP("ragnus"), null, "auto");

export const webcam = (path: string, host: string = "www.grepawk.com:8554") => {
  const { stdin, stdout, stderr } = cspawn(
    `ffmpeg -f avfoundation -video_size 640x480 -pixel_format uyvy422 -r 25 -i 0: -f rtsp rtsp://${host}/${path}`
  );

  stderr.pipe(process.stderr);
  stdout.pipe(process.stderr);
  return stdin;
};
