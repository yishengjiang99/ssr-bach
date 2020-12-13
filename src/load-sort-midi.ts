import { Midi } from "@tonejs/midi";
import { EventEmitter } from "events";
import { Filename, RemoteControl } from "./ssr-remote-control.types";
import { sleep } from "./utils";

export function convertMidi(source: Filename, realtime): RemoteControl {
  const emitter = new EventEmitter();
  const { tracks, header } = new Midi(require("fs").readFileSync(source));
  const state = {
    paused: false,
    time: 0,
    midifile: source,
  };
  const setState = (update: { [key: string]: string | boolean | number }) => {
    Object.keys(update).forEach((k) => (state[k] = update[k]));
  };
  emitter.emit("#meta", {
    name: header.name,
  });
  emitter.emit("#tempo", {
    bmp: header.tempos[0].bpm,
    signature: header.timeSignatures[0].timeSignature,
  });
  const controller = {
    pause: () => setState({ paused: true }),
    resume: () => {
      emitter.emit("resume");
      setState({ paused: false });
    },
    ff: () => setState({ time: state.time + 15 }),
    next: () => {},
    rwd: () => setState({ time: Math.max(state.time - 15, 0) }),
    emitter,
  };
  async function pullMidiTrack(tracks, cb) {
    let now = -1;
    let done = 0;
    let doneSet = new Set();
    while (tracks.length > done) {
      console.log(now, done);
      tracks.forEach((track, i) => {
        if (doneSet.has(i)) return;
        if (!track.notes || track.notes.length === 0) {
          doneSet.add(i);
          done++;
          return;
        }
        if (track.notes[0] > now) return;
        emitter.emit("note", {
          ...track.notes.shift(),
          instrument: format(track.instrument.name),
        });
      });
      now = await cb(now);
      emitter.emit("time", header.ticksToMeasures(now));
    }
    emitter.emit("ended");
  }

  function currentTempo(now) {
    let shifted = now < 0;
    if (header.tempos[1] && now >= header.tempos[1].ticks) {
      header.tempos.shift();
      shifted = true;
    }
    if (header.timeSignatures[1] && now >= header.timeSignatures[1].ticks) {
      header.timeSignatures.shift();
      shifted = true;
    }
    let ppb = header.ppq;
    let bpm = header.tempos[0].bpm || 120;
    let signature = header.timeSignatures[0].timeSignature;
    let beatLengthMs = 60000 / header.tempos[0].bpm;
    let ticksPerbeat = (header.ppq / signature[1]) * 4;
    return { ppb, bpm, ticksPerbeat, signature, beatLengthMs, shifted };
  }

  const callback = async (now: number) => {
    const { beatLengthMs, ticksPerbeat, shifted } = currentTempo(now);
    if (shifted) {
      emitter.emit("tempo", {
        bmp: header.tempos[0].bpm,
        signature: header.timeSignatures[0].timeSignature,
      });
    }
    if (now >= 0 && realtime) {
      await sleep(beatLengthMs);
    }
    if (state.paused) {
      await new Promise((resolve) => {
        this.emitter.on("resume", resolve);
      });
    }
    return now + ticksPerbeat;
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
