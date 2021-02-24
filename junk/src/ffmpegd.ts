import { readFile, readFileSync } from "fs";
import { resolve } from "path";
import { Readable } from "stream";
import { PassThrough } from "stream";
import { cspawn } from "./cspawn";
import { ffp } from "./sinks";

export function ffjmpegd({ pitchRatio, inputSampleRate, outputSampleRate }) {
  const pt = new PassThrough();
  let buffer = Buffer.alloc(0);

  const addBuffer = (_buffer: Buffer) => {
    buffer = Buffer.concat([_buffer, buffer]);
  };
  const ffmpegd = cspawn(`ffmpeg -i pipe:0 -af tempo=${pitchRatio} -`, [
    new Readable({
      autoDestroy: false,
      read: (n: number) => {
        if (buffer.byteLength > n) {
          const ret = buffer.slice(0, n);
          buffer = buffer.slice(n);
          console.log(buffer);
          return ret;
        } else {
          const ret = Buffer.concat([buffer, Buffer.alloc(n - buffer.byteLength)]);
          buffer = Buffer.alloc(0);
          console.log(ret);

          return ret;
        }
      },
    }),
    pt,
    process.stderr,
  ]);

  const runsample = (sample: Buffer) => {
    return new Promise((resolve) => {
      let outputCount = (sample.byteLength / inputSampleRate) * outputSampleRate;
      let results = [];
      addBuffer(sample);
      pt.on("data", (d) => {
        console.log(d);
        if (outputCount - d.byteLength > 0) {
          results.push(d);
        } else {
          results.push(d.slice(0, d.byteLength - outputCount));
          resolve(Buffer.concat(results));
        }
      });
    });
  };
  return {
    addBuffer,
    output: pt,
    pid: ffmpegd.pid,
    runsample,
  };
}

ffjmpegd({
  pitchRatio: 3,
  inputSampleRate: 44800,
  outputSampleRate: 44800,
})
  .runsample(readFileSync("./midisf/0-stereo-40.pcm"))
  .then((o) => console.log(o));
