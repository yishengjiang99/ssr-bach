import { existsSync, closeSync } from "fs";
import { PulseSource, SSRContext, Envelope } from "ssr-cxt";
import { PassThrough, Writable } from "stream";
import { convertMidi } from "./load-sort-midi";
import { RemoteControl } from "./ssr-remote-control.types";
import { sleep, std_drums } from "./utils";

import { ffp, lowpassFilter } from "./sinks";
import { NoteEvent } from "./NoteEvent";
class PulseTrackSource extends PulseSource {
  note: NoteEvent;
  trackId: number;
  envelope: Envelope;
  constructor(
    ctx,
    props: { buffer: Buffer; note: NoteEvent; trackId: number; velocity: number }
  ) {
    super(ctx, { buffer: props.buffer });
    this.note = props.note;
    this.trackId = props.trackId;
    // this.envelope = new Envelope(48000, [
    //   ((145 - props.velocity) / 144) * 0.1,
    //   0.1,
    //   0.4,
    //   0.4,
    // ]);
  }
}
export class Player {
  nowPlaying: RemoteControl = null;
  ctx: SSRContext = new SSRContext({
    nChannels: 1,
    bitDepth: 32,
    sampleRate: 31000,
    fps: 31,
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
    this.tracks = new Array(controller.state.tracks.length);
    
    (async ()=>{
   
       controller.setCallback(
         async (notes: NoteEvent[]): Promise<number> => {
           const startloop = process.uptime();

           notes.map((note, i) => {

             if (this.tracks[note.trackId]) {
               this.tracks[note.trackId].buffer = Buffer.alloc(0);
               this.tracks[note.trackId] = null;
             }
             const presetid = note.instrument.percussion ? std_drums[note.instrument.number] : note.instrument.number;
             this.tracks[note.trackId] = new PulseTrackSource(ctx, {
               buffer: sample(presetid, note.midi, note.velocity*0x7f, note.durationTime),
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
       if (autoStart) controller.start();
           this.timer = setInterval(() => {
             const summingbuffer = new DataView(Buffer.alloc(ctx.blockSize).buffer);
             let inputViews: [Buffer, PulseTrackSource][] = this.tracks
               .filter((t, i) => t && t.buffer)
               .map((t) => [t.read(), t]);

             const n = inputViews.length;
             for (let k = 0; k < ctx.blockSize-4; k += 4) {
               let sum = 0;

               for (let j = n - 1; j >= 0; j--) {
                 sum =
                   sum +
                   inputViews[j][0].readFloatLE(k);
               }

               summingbuffer.setFloat32(k, sum, true);
             }

             if (!output.writableEnded) output.write(Buffer.from(summingbuffer.buffer));
           }, (ctx.secondsPerFrame * 1000) / playbackRate);
    })();

    this.output = output;



    output.on("close", () => {
      controller.stop();
      this.stop();
    });
    return controller;
  };
  timer: NodeJS.Timeout;
  tracks: PulseTrackSource[];
}
if (process.argv[2]) {
  //  const pt = new PassThrough();
  new Player().playTrack(
    process.argv[2],ffp({ac:1, ar:12000})
  ); // lowpassFiler(4000).stdout.pipe(ffp()));
}
