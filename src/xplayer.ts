import { existsSync, closeSync } from "fs";
import { cspawn } from "./cspawn";
import { SSRContext } from "ssr-cxt";
import { PassThrough, Writable } from "stream";
import { convertMidi } from "./load-sort-midi";
import { RemoteControl } from "./ssr-remote-control.types";
import { NoteEvent } from "./NoteEvent";
import { sleep, std_drums } from "./utils";

import { devnull, ffp, lowpassFilter } from "./sinks";
import { PulseTrackSource } from "./PulseTrackSource";
import { load, findIndex, memcopy, resolvebuffer } from "./resolvebuffer";
const spriteBytePeSecond = 48000 * 2 * 4;

export class Player {
  nowPlaying: RemoteControl = null;
  ctx: SSRContext = new SSRContext({
    nChannels: 1,
    bitDepth: 16,
    sampleRate: 44100,
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
  stop = () => {
    if (this.nowPlaying) this.nowPlaying.stop();
    if (this.output) this.output.end();
    if (this.timer) clearInterval(this.timer);
  };
  msg = (msg: string, reply: { write: (string) => void }): void => {
    let tt: string[] = msg.split(" ");
    const [cmd, arg1, arg2] = [tt.shift(), tt.shift(), tt.shift()];
    if (cmd === "config")
    {
      this.setSetting(arg1, parseFloat(arg2));
      return reply.write("ack config " + arg1 + " " + arg2);
    }
    if (this.nowPlaying && cmd === "seek")
    {
      this.nowPlaying.seek(parseInt(arg1));
      return reply.write({ rcstate: { seek: this.nowPlaying.state.time } });
    }
    switch (cmd)
    {
      case "resume":
        this.nowPlaying.resume();
        break;
      case "stop":
        this.nowPlaying.stop();
        this.nowPlaying.emitter.removeAllListeners();

        break;
      case "pause":
        this.nowPlaying.pause();
        break;
      default:
        reply.write("unknown handler " + cmd);
        break;
    }
  };
  playTrack = (
    file: string,
    output: Writable,
    autoStart: boolean = true,
    playbackRate: number = 1
  ): RemoteControl => {
    const ctx = this.ctx;
    const controller = convertMidi(file);
    this.nowPlaying = controller;
    this.tracks = new Array(controller.state.tracks.length);
    controller.setCallback(
      async (notes: NoteEvent[]): Promise<number> => {
        const startloop = process.uptime();

        notes.map((note, i) => {
          const bytelength = spriteBytePeSecond * note.durationTime;

          if (this.tracks[note.trackId])
          {
            this.tracks[note.trackId].buffer = Buffer.alloc(0);
            this.tracks[note.trackId] = null;
          }
          const { durationTime, midi, velocity, instrument: { percussion, number } } = note;
          this.tracks[note.trackId] = new PulseTrackSource(ctx, {
            buffer: resolvebuffer(percussion ? std_drums[number] : number, midi, velocity, durationTime),
            trackId: note.trackId,
            note: note,
            velocity: note.velocity,
          });

        });
        const elapsed = process.uptime() - startloop;
        await sleep((ctx.secondsPerFrame * 1000) / playbackRate);
        return ctx.secondsPerFrame;
      }
    );
    this.output = output;

    if (autoStart) controller.start();
    ctx.nChannels = 1;
    ctx.bitDepth = 16;
    ctx.sampleRate = 44100;
    this.timer = setInterval(() => {
      const summingbuffer = Buffer.alloc(ctx.blockSize);
      const input = Buffer.alloc(ctx.blockSize);
      const inputViews = this.tracks.filter(t => t && t.buffer && t.buffer.byteLength > 0).map(t => {
        return t.read();
      })

      const n = inputViews.length;
      let rsum = 0;
      for (let k = 0; k < ctx.blockSize - 4; k += 4)
      {
        let sum = 0;

        for (let j = n - 1; j >= 0; j--)
        {
          sum = sum + inputViews[j].readFloatLE(k);
          // break;
          break;
        }
        summingbuffer.writeFloatLE(sum, k);
      }
      // console.log(rsum / 120);
      if (!output.writableEnded) output.write(Buffer.from(summingbuffer.buffer));
    }, (ctx.secondsPerFrame * 1000) / playbackRate);

    output.on("close", () => {
      controller.stop();
      this.stop();
    });
    return controller;
  };
  loadTrack = (filename) => {
    return this.playTrack(filename, devnull(), false);
  };
  timer: NodeJS.Timeout;
  tracks: PulseTrackSource[];
}

let sfdata;
if (!sfdata)
{
  sfdata = load();
}