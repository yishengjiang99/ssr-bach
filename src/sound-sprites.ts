import { Writable } from "stream";
import { convertMidi } from "./load-sort-midi";
import { openSync, readSync, closeSync, createWriteStream, existsSync } from "fs";
import { SSRContext, PulseSource, Envelope, Oscillator } from "ssr-cxt";
import { NoteEvent, RemoteControl } from "./ssr-remote-control.types";
import { cspawn, sleep } from "./utils";
import { Readable } from "stream";
import { PassThrough } from "stream";
import { ffp } from "./sinks";

export const produce = (
  songname: string,
  output: Writable = createWriteStream(songname + ".pcm"),
  interrupt: Readable = null,
  playbackRate: number = 1,
  autoStart: boolean = true
): RemoteControl => {
  const ctx = new SSRContext({
    nChannels: 2,
    bitDepth: 32,
    sampleRate: 48000,
    fps: 375,
  });
  const spriteBytePeSecond = ctx.bytesPerSecond;

  let intervalAdjust = 0;
  let settings = {
    preamp: 1,
    threshold: 55, //0.001
    ratio: 4,
    knee: 88,
  };
  const controller = convertMidi(songname);

  const tracks: PulseSource[] = new Array(controller.state.tracks.length);
  controller.setCallback(
    async (notes: NoteEvent[]): Promise<number> => {
      const startloop = process.uptime();

      notes.map((note, i) => {
        let velocityshift = 0; //note.velocity * 8;
        let fadeoutTime = (1 - note.velocity) / 10;
        const bytelength = spriteBytePeSecond * note.durationTime;
        let file;
        if (note.instrument.includes("piano")) {
          fadeoutTime = 0;
          velocityshift = 48;

          file = `./midisf/${note.instrument}/${note.midi - 21}v${
            note.velocity > 0.4 ? "16" : note.velocity > 0.23 ? "8.5-PA" : "1-PA"
          }.pcm`;
        } else {
          file = `./midisf/${note.instrument}/stero-${note.midi - 21}.pcm`;
        }

        if (!existsSync(file)) {
          file = `./midisf/clarinet/${note.midi - 21}.pcm`;
        } else {
          const fd = openSync(file, "r");

          const ob = Buffer.alloc(bytelength);
          if (note.durationTime < 1.0) {
            velocityshift = note.velocity * 1028;
          }
          readSync(fd, ob, 0, bytelength, 0);
          closeSync(fd);
          if (tracks[note.trackId]) {
            tracks[note.trackId].buffer = Buffer.alloc(0);
            tracks[note.trackId] = null;
            //to prevent overlap of sound frm same track..
          }
          tracks[note.trackId] = new PulseSource(ctx, {
            buffer: ob,
          });
        }
      });
      const elapsed = process.uptime() - startloop;
      await sleep(ctx.secondsPerFrame * 1000);
      return ctx.secondsPerFrame; // / 1000;
    }
  );
  let closed = false;

  if (autoStart) controller.start();
  output.on("close", (d) => {
    controller.stop();
    closed = true;
  });
  setInterval(() => {
    const { preamp, threshold, knee, ratio } = settings;
    // ctx.pump({ preamp, compression: { threshold, knee, ratio } });
    const summingbuffer = new DataView(Buffer.alloc(ctx.blockSize).buffer);
    let inputViews = tracks
      .filter((t, i) => t && t.buffer && t.buffer.byteLength >= ctx.blockSize)
      .map((t) => t.read());
    const n = inputViews.length;

    for (let k = 0; k < ctx.blockSize; k += 4) {
      let sum = 0;
      for (let j = n - 1; j >= 0; j--) {
        sum += inputViews[j].readFloatLE(k);
      }

      summingbuffer.setFloat32(k, sum, true);

      // summingbuffer.setFloat32(2 * k + 4, n, true);
    }

    output.write(Buffer.from(summingbuffer.buffer));
    //  console.log(".");
  }, ctx.secondsPerFrame * 1000);

  return controller;
};

if (require.main === module) {
  // produce("./midi/song.mid", cspawn("nc -l 8080").stdin, process.stdin);
  // console.log("nc grepawk.com 8080 |ffplay -i pipe:0 -f f32le -ac 2 -ar 48000");
  // require("net")
  //   .createServer()
  //   .on("connection", (sock) => {
  //     produce("./midi/song.mid", sock, process.stdin);
  //   })
  //   .listen(8111);
}
