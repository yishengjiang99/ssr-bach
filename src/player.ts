import { existsSync, openSync, readSync, closeSync } from "fs";
import { cspawn } from "./utils";
import { Envelope, Oscillator, PulseSource, SSRContext } from "ssr-cxt";
import { Writable } from "stream";
import { convertMidi } from "./load-sort-midi";
import { NoteEvent, RemoteControl } from "./ssr-remote-control.types";
import { sleep } from "./utils";
import { stdformat } from "./ffmpeg-templates";

const spriteBytePeSecond = 48000 * 1 * 4;

export class Player {
  nowPlaying: RemoteControl = null;
  ctx: SSRContext = new SSRContext({
    nChannels: 1,
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
  setSetting = (attr, value) => {
    this.settings[attr] = value;
  };
  lastPlayedSettings = null;
  playTrack = (file: string, output: Writable, autoStart: boolean = true) => {
    const ctx = this.ctx;
    let lastSettingsUsed = this.lastPlayedSettings;
    let settings = this.settings;

    this.nowPlaying = convertMidi(
      file,
      async (notes: NoteEvent[]): Promise<number> => {
        /* this the main event loop of the whoe thing*/
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
            file = `./midisf/${note.instrument}/${note.midi - 21}.pcm`;
          }

          if (!existsSync(file)) {
            ctx.inputs.push(
              new Oscillator(ctx, {
                frequency: Math.pow(2, note.midi - 69) * 440,
                start: ctx.currentTime,
                end: ctx.currentTime + note.durationTime,
              })
            );
          } else {
            const fd = openSync(file, "r");

            const ob = Buffer.alloc(bytelength);
            if (note.durationTime < 1.0) {
              velocityshift = note.velocity * 1028;
            }
            readSync(fd, ob, 0, bytelength, velocityshift);
            closeSync(fd);
            new PulseSource(ctx, {
              buffer: ob,
              envelope: new Envelope(48000, [0.05, 0.1, 80, 0.4]),
            });
          }
        });
        let { preamp, threshold, knee, ratio } = settings;
        lastSettingsUsed = { preamp, compression: { threshold, knee, ratio } };
        ctx.pump({ preamp, compression: { threshold, knee, ratio } });
        const elapsed = process.uptime() - startloop;
        await sleep((ctx.secondsPerFrame / settings.playbackRate) * 1000 - elapsed);
        return ctx.secondsPerFrame; // / 1000;
      }
    );

    let controller = this.nowPlaying;
    let closed = false;
    output.on("close", (d) => {
      controller.stop();
      ctx.unpipe();
      ctx.stop();
      closed = true;
    });
    const ffm = cspawn(
      `ffmpeg -f f32le -ac 2 -ar 48k -i pipe:0 -filter:a loudnorm -f f32le -ac 2 -ar 48k -`
    );
    ffm.stdout.on("error", (e) => console.error(e.mesage.toString()));
    ctx.on("data", (d) => {
      output.write(d);
    });

    if (autoStart) controller.start();

    return controller;
  };
}
