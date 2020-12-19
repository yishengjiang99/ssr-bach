import { Header, Midi } from "@tonejs/midi";
import { EventEmitter } from "events";
import { Filename, RemoteControl } from "./ssr-remote-control.types";
import { sleep } from "./utils";

export function convertMidi(
  source: Filename,
  realtime: boolean
): RemoteControl {
  const emitter = new EventEmitter();
  const { tracks, header } = new Midi(require("fs").readFileSync(source));
  const tempos = JSON.parse(JSON.stringify(header.tempos));
  console.log(tempos);
  const state = {
    paused: false,
    time: 0,
    ticks: 0,
    stop: false,
    midifile: source,
    tempo: tempos[0],
    timeSignature: header.timeSignatures[0],
  };
  emitter.emit("#tempo", state.tempo.bpm, state.timeSignature.timeSignature);

  const setState = (update: { [key: string]: string | boolean | number }) => {
    Object.keys(update).forEach((k) => (state[k] = update[k]));
  };
  const controller = {
    pause: () => setState({ paused: true }),
    resume: () => {
      emitter.emit("resume");
      setState({ paused: false });
    },
    stop: () => setState({ stop: true }),
    ff: () => setState({ time: state.time + 15 }),
    next: () => {},
    rwd: () => setState({ time: Math.max(state.time - 15, 0) }),
    emitter,
    state,
  };

  const pullMidiTrack = async (tracks, cb) => {
    let done = 0;
    let doneSet = new Set();
    const t0 = process.uptime();
    // const ticksPerSecond = (state.tempo.bpm / 60) * header.ppq;
    while (tracks.length > done) {
      const now = header.secondsToTicks(process.uptime() - t0); // * ticksPerSecond;
      for (let i = 0; i < tracks.length; i++) {
        if (doneSet.has(i)) continue;
        if (!tracks[i].notes || tracks[i].notes.length === 0) {
          doneSet.add(i);
          done++;
          continue;
        }
        while (tracks[i].notes[0] && tracks[i].notes[0].ticks <= now + 5) {
          const note = tracks[i].notes.shift();
          emitter.emit("note", {
            ...note,
            trackId: i,

            start: header.ticksToSeconds(note.ticks),
            durationTime:
              ((60 / state.tempo.bpm) * note.durationTicks) / header.ppq,
            velocity: note.velocity * 0x7f,
            instrument: format(tracks[i].instrument.name),
          });
        }
        if (tempos[1] && now >= tempos[1].ticks) {
          tempos.shift();
          state.tempo = tempos[0];
          emitter.emit("#tempo", { bpm: state.tempo.bpm });
        }
      }
      await cb();
      if (state.stop) break;
    }
    emitter.emit("ended");
  };

  const callback = async () => {
    if (realtime) await sleep(30);
    else await sleep(0);
    if (state.paused) {
      await new Promise((resolve) => {
        emitter.on("resume", resolve);
      });
    }
  };

  pullMidiTrack(tracks, callback);

  return controller;
}

function format(str) {
  return str

    .replace(" ", "_")
    .replace(" ", "_")
    .replace(" ", "_")

    .replace(" ", "_");
}
