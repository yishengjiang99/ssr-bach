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
    state,
  };
  const pullMidiTrack = async (tracks, cb) => {
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
      await cb();
      // await cb();
      console.log(done);
      console.log(doneSet);
    }
    emitter.emit("ended");
  };
  const callback = async () => {
    function currentTempo(now) {
      if (header.tempos[1] && now >= header.tempos[1].ticks) {
        header.tempos.shift();
      }
      if (header.timeSignatures[1] && now >= header.timeSignatures[1].ticks) {
        header.timeSignatures.shift();
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
    const { beatLengthMs, ticksPerbeat } = currentTempo(state.time);
    if (realtime) await sleep(beatLengthMs / 4);
    else await sleep(0);
    setState({
      ticks: state.ticks + ticksPerbeat / 4,
      time: state.time + beatLengthMs / 4,
    });

    if (state.paused) {
      await new Promise((resolve) => {
        emitter.on("resume", resolve);
      });
    }

    emitter.emit("#time", [state.time, state.ticks]);
    console.log("#time", state.time, state.ticks);
    currentTempo(state.ticks);
    return ticksPerbeat;
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
