import { execSync, spawn } from "child_process";
import { createWriteStream, existsSync } from "fs";
import { createReadStream, ReadStream } from "fs";
import { SSRContext } from "ssr-cxt";
import { PassThrough } from "stream";
import { convertMidiSequencer } from "./convertMidiSequencer";
import { cspawn } from "./cspawn";
import { convertMidi, convertMidiASAP } from "./load-sort-midi";
import { NoteEvent } from "./NoteEvent";
import { readAsCSV } from "./read-midi-sse-csv";
import { ffp } from "./sinks";
import { sleep } from "./utils";

const pipe1 = createWriteStream("here.pcm");
const sp1 = [spawn("./sampled 2"), spawn("./sampled 1"), spawn("./sampled 0")];

let mix: (ReadStream | string)[] = [];
const sampleStr = (sample: NoteEvent) =>
  `p ${sample.instrument.number} ${sample.midi} ${~~(sample.durationTime * 1000)} ${~~(
    sample.velocity * 0x7f
  )}`;
const ctx = SSRContext.default();

const cc = convertMidi("./midi/song.mid");
cc.setCallback(async (notes) => {
  const startloop = process.uptime();
  notes.map((sample) => {
    console.log(sampleStr(sample));
    sp1[sample.instrument.number % 3].stdin.write(sampleStr(sample));
  });
  mix = mix.concat(
    sp1.map((sp) => {
      const filen = execSync("mktemp -u").toString().trimEnd();
      sp.stdin.write(`r here.pcm`);
      return filen;
    })
  );
  const elapsed = process.uptime() - startloop;
  await sleep((ctx.secondsPerFrame * 1000 - elapsed * 1000) / 1);
  return ctx.secondsPerFrame;
});
cc.start();
cc.emitter.on("note", console.log);
setInterval(() => {
  const summingbuffer = Buffer.alloc(ctx.blockSize * 10 * Float32Array.BYTES_PER_ELEMENT);
  mix = mix
    .map((item) =>
      typeof item === "string"
        ? (existsSync(item) && createReadStream(item)) || null
        : item
    )
    .filter((v) => v);
  mix = mix.filter((r) => r instanceof ReadStream && r.readableEnded === false);
  //console.log(mix.length);
  const buffers: Buffer[] = mix
    .map((m: ReadStream) => m.read(ctx.blockSize * 10))
    .filter((r) => r);
  for (let k = 0; k < ctx.blockSize * 10; k += 4) {
    let sum = 0,
      carry = 0;
    for (let j = 0; j < buffers.length; j++) {
      sum = sum + buffers[j].readFloatLE(k);
      if (sum > 0.8) {
        carry += 0.1;
        sum -= 0.1;
      }
    }
    // console.log(summingbuffer.reduce((sum, v) => sum + v, 0));
    summingbuffer.writeFloatLE(sum, k);
  }
  pipe1.write(summingbuffer);
}, ctx.secondsPerFrame * 10000);
