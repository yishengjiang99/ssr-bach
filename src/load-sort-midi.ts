import { Midi } from "@tonejs/midi";
import { EventEmitter } from "events";
import { Filename, RemoteControl } from "./ssr-remote-control.types";
import { sleep } from "./utils";

export function convertMidi(
  source: Filename,
  realtime: boolean
): RemoteControl {
  const emitter = new EventEmitter();
  const { tracks, header } = new Midi(require("fs").readFileSync(source));
  const state = {
    paused: false,
    time: 0,
    ticks: 0,
    measure: 0,
    stop: false,
    midifile: source,
    tempo: header.tempos[0].bpm,
    timeSignature: header.timeSignatures[0].timeSignature,
  };

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
    console.log("start");
    const { beatLengthMs, ticksPerbeat } = currentTempo(0);

    let done = 0;
    let doneSet = new Set();
    while (tracks.length > done) {
      for (let i = 0; i < tracks.length; i++) {
        if (doneSet.has(i)) continue;
        if (!tracks[i].notes || tracks[i].notes.length === 0) {
          doneSet.add(i);
          done++;
          continue;
        }
        while (tracks[i].notes[0] && tracks[i].notes[0].ticks <= state.ticks) {
          let note = tracks[i].notes.shift();
          emitter.emit("note", {
            ...note, //...tracks[i].notes.shift(),
            trackId: i,
            velicity: note.velocity * 0x7f,
            instrument: format(tracks[i].instrument.name),
          });
        }
      }
      await cb();
      if (state.stop) break;
    }
    emitter.emit("ended");
  };
  function currentTempo(now: number) {
    let shifted = 0;
    if (header.tempos[1] && now >= header.tempos[0].ticks) {
      header.tempos.shift();
      shifted = 1;
    }
    if (header.timeSignatures[1] && now >= header.timeSignatures[0].ticks) {
      header.timeSignatures.shift();
      shifted = 1;
    }
    let ppb = header.ppq;
    let bpm =
      (header.tempos && header.tempos[0] && header.tempos[0].bpm) || 120;
    let signature = (header.timeSignatures &&
      header.timeSignatures[0] &&
      header.timeSignatures[0].timeSignature) || [4, 4];

    let beatLengthMs = 60000 / header.tempos[0].bpm;
    let ticksPerbeat = header.ppq;
    const beatResolution = signature[1];
    const quarterNotesInBeat = signature[0];
    if (now === 0 || shifted) {
      emitter.emit("#tempo", {
        bpm,
        ticksPerbeat,
        beatLengthMs,
        quarterNotesInBeat,
        beatResolution,
      });
    }
    return {
      ppb,
      bpm,
      ticksPerbeat,
      signature,
      beatLengthMs,
      beatResolution,
      quarterNotesInBeat,
    };
  }
  const callback = async () => {
    const {
      beatLengthMs,
      ticksPerbeat,
      quarterNotesInBeat,
      beatResolution,
    } = currentTempo(state.ticks);
    const interval = ((1 / 8) * quarterNotesInBeat) / beatResolution;

    emitter.emit("#time", [
      header.ticksToSeconds(state.ticks),
      state.ticks,
      header.ticksToMeasures(state.ticks),
    ]);
    if (realtime) await sleep(beatLengthMs * interval);
    else await sleep(0);
    setState({
      ticks: state.ticks + ticksPerbeat * interval,
      time: state.time + beatLengthMs * interval,
    });
    if (state.paused) {
      await new Promise((resolve) => {
        emitter.on("resume", resolve);
      });
    }
    return ticksPerbeat;
  };
  emitter.emit("#tempo", { bpm: header.tempos[0].bpm });
  emitter.emit("#meta", "debug");

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
