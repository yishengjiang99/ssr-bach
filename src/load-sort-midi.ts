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
    tempo: null,
    timeSignature: null,
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
    ff: () => setState({ time: state.time + 15 }),
    next: () => {},
    rwd: () => setState({ time: Math.max(state.time - 15, 0) }),
    emitter,
  };
  async function pullMidiTrack(tracks, cb) {
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
        while (tracks[i].notes[0] && tracks[i].notes[0].ticks <= state.time) {
          emitter.emit("note", {
            ...tracks[i].notes.shift(),
            trackId: i,
            instrument: format(tracks[i].instrument.name),
          });
        }
      }

      if (!realtime) state.time += 10;
      else {
        await cb();
      }
      // await cb();
    }
    emitter.emit("ended");
  }

  function currentTempo(now) {
    if (!state.tempo || (header.tempos[0] && now >= header.tempos[0].ticks)) {
      state.tempo = header.tempos.shift();
      emitter.emit("#tempo", state.tempo);
    }
    if (
      !state.timeSignature ||
      (header.timeSignatures[0] && now >= header.timeSignatures[0].ticks)
    ) {
      state.timeSignature = header.timeSignatures.shift().timeSignature;
      emitter.emit("#timeSignature", state.timeSignature);
    }
  }

  const callback = async () => {
    let beatLengthMs = 60000 / state.tempo.bpm;
    let ticksPerbeat = (header.ppq / state.timeSignature[1]) * 4;
    if (state.paused) {
      await new Promise((resolve) => {
        emitter.on("resume", resolve);
      });
    }

    if (state.time >= 0 && realtime) {
      await sleep(beatLengthMs);
    }
    emitter.emit("#time", header.ticksToMeasures(state.time));
    setState({
      time: state.time + ticksPerbeat,
    });
    currentTempo(state.time);
    return ticksPerbeat;
  };
  currentTempo(state.time);
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
