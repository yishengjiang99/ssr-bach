import { existsSync, closeSync, createReadStream } from "fs";
import { cspawn } from "./cspawn";
import { FileSource, SSRContext } from "ssr-cxt";
import { PassThrough, Writable } from "stream";
import { convertMidi } from "./load-sort-midi";
import { RemoteControl } from "./ssr-remote-control.types";
import { NoteEvent } from "./NoteEvent";
import { sleep } from "./utils";

import { ffp, lowpassFilter } from "./sinks";
import { PulseTrackSource } from "./PulseTrackSource";
import { spawn } from "child_process";
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
  stop = () => {
    if (this.nowPlaying) this.nowPlaying.stop();
    if (this.output) this.output.end();
    if (this.timer) clearInterval(this.timer);
  };
  msg = (msg: string, reply: { write: (string) => void }): void => {
    let tt: string[] = msg.split(" ");
    const [cmd, arg1, arg2] = [tt.shift(), tt.shift(), tt.shift()];
    if (cmd === "config") {
      this.setSetting(arg1, parseFloat(arg2));
      return reply.write("ack config " + arg1 + " " + arg2);
    }
    if (this.nowPlaying && cmd === "seek") {
      this.nowPlaying.seek(parseInt(arg1));
      return reply.write({ rcstate: { seek: this.nowPlaying.state.time } });
    }
    switch (cmd) {
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
    // this.tracks = new Array(controller.state.tracks.length);
    let tracks = new Array(controller.state.tracks.length);
    tracks.forEach((t,i)=>{
      sp.stdin.write(`prog ${i}, ${t.instrument.number}`)
    });
    const sp = cspawn("fluidsynth -a file -o audio.file.name=/tmp/fl.raw -o audio.file.format=float file.sf2");

    controller.setCallback(
      async (notes: NoteEvent[]): Promise<number> => {
        const startloop = process.uptime();
        notes.forEach((sample) => {
          sp.stdin.write(
            `noteon ${sample.instrument.number} ${sample.midi} ${~~(
              sample.durationTime * 1000
            )} ${~~(sample.velocity * 0x7f)} ${sample.trackId} \n`
          );
          console.log(`s ${sample.instrument.number} ${sample.midi} ${~~(
              sample.durationTime * 1000
            )} ${~~(sample.velocity * 0x7f)} ${sample.trackId} \n`);
        });
        const elapsed = process.uptime() - startloop;
        await sleep((ctx.secondsPerFrame * 1000 - elapsed * 1000) / playbackRate);
        return ctx.secondsPerFrame;
      }
    );

    this.output = output;

    if (autoStart) controller.start();

    // this.timer = setInterval(() => {
    //      sp.stdin.write('r\n');
    //  // this.mixtrack(ctx, tracks, output);
    // }, (ctx.secondsPerFrame * 1000) / playbackRate);

  createReadStream("/Volumes/RAMDisk/song.pcm").on("data",d=>{
   if (!output.writableEnded){}
     // output.write(d);
  });
  
    output.on("close", () => {
      controller.stop();
      this.stop();
    });
    return controller;
  };
  timer: NodeJS.Timeout;
  tracks: PulseTrackSource[];

  private mixtrack(ctx: any, tracks: any[], output: Writable) {
    const summingbuffer = new DataView(Buffer.alloc(ctx.blockSize).buffer);
    let inputViews: Buffer[] = tracks
      .filter((v) => v)
      .map((t) => t.read(ctx.blockSize));

    const n = inputViews.length;
    // console.log(n + " inputs");
    let rs = 0;
    for (let k = 0; k < ctx.blockSize; k += 4)
    {
      let sum = 0;

      for (let j = n - 1; j >= 0; j--)
      {
        sum = sum + inputViews[j].readFloatLE(k);
      }

      summingbuffer.setFloat32(k, sum, true);
      rs += sum * sum;
    }
    // console.log(Math.sqrt(rs));
    if (!output.writableEnded)
      output.write(Buffer.from(summingbuffer.buffer));
  }
}
if (require.main === module && process.argv[2]) {
new Player().playTrack(process.argv[2], process.stdout);
}
