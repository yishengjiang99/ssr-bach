import { existsSync, openSync, readSync, closeSync } from "fs";
import { cspawn } from "./utils";
import { Envelope, Oscillator, PulseSource, SSRContext } from "ssr-cxt";
import { Writable } from "stream";
import { convertMidi } from "./load-sort-midi";
import { NoteEvent, RemoteControl } from "./ssr-remote-control.types";
import { sleep } from "./utils";
import { stdformat } from "./ffmpeg-templates";

const spriteBytePeSecond = 48000 * 2 * 4;

export class Player {
  nowPlaying: RemoteControl = null;
  ctx: SSRContext = new SSRContext({
    nChannels: 2,
    bitDepth: 32,
    sampleRate: 48000,
    fps: 375,
  });
  settings = {
    preamp: 1,
    threshold: -60, //0.001
    ratio: 4,
    knee: -40,
    playbackRate: 1,
  };
  output: Writable;
  setSetting = (attr, value) => {
    this.settings[attr] = value;
  };
  lastPlayedSettings = null;
  playTrack = (file: string, output: Writable, autoStart: boolean = true) => {
    const ctx = this.ctx;
    const controller = convertMidi(file);
    this.nowPlaying = controller;
    const tracks: PulseSource[] = new Array(controller.state.tracks.length);
    controller.setCallback(
      async (notes: NoteEvent[]): Promise<number> => {
        const startloop = process.uptime();

        notes.map((note, i) => {
          const bytelength = spriteBytePeSecond * note.durationTime;
          let file = getFilePath(note);
          const fd = openSync(file, "r");
          const ob = Buffer.allocUnsafe(bytelength);
          readSync(fd, ob, 0, bytelength, 0);
          closeSync(fd);
          if (tracks[note.trackId]) {
            tracks[note.trackId].buffer = Buffer.alloc(0);
            tracks[note.trackId] = null;
          }
          tracks[note.trackId] = new PulseSource(ctx, {
            buffer: ob,
          });
        });
        const elapsed = process.uptime() - startloop;
        await sleep(ctx.secondsPerFrame * 1000);
        return ctx.secondsPerFrame;
      }
    );
    this.output = output;

    let closed = false;
    output.on("close", (d) => {
      controller.stop();

      closed = true;
    });

    if (autoStart) controller.start();
    output.on("close", (d) => {
      controller.stop();
      closed = true;
    });
    setInterval(() => {
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
      }

      if (!output.writableEnded) output.write(Buffer.from(summingbuffer.buffer));
    }, ctx.secondsPerFrame * 1000);

    return controller;
  };
}

function getFilePath(note) {
  let file;
  if (note.instrument.includes("piano") && note.midi - 33 <= 68) {
    file = `./midisf/${note.instrument}/${note.midi - 33}v${
      note.velocity > 0.4 ? "16" : note.velocity > 0.23 ? "8.5-PA" : "1-PA"
    }.pcm`;
  } else {
    file = `./midisf/${note.instrument}/stero-${note.midi - 33}.pcm`;
  }

  if (!existsSync(file)) {
    file = `./midisf/clarinet/${note.midi - 33}.pcm`;
  }
  return file;
}
