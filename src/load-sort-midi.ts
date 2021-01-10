import { Header, Midi } from "@tonejs/midi";
import { EventEmitter } from "events";

import {
  Filename,
  RemoteControl,
  MidiFile,
  NoteEvent,
  ControllerState,
  CallbackFunction,
  Ticks,
} from "./ssr-remote-control.types";
import { sleep, std_inst_names } from "./utils";

export function convertMidi(source: MidiFile, cb?: CallbackFunction): RemoteControl {
  const emitter = new EventEmitter();
  const { duration, durationTicks, tracks, header } = new Midi(
    require("fs").readFileSync(source)
  );

  const tempos = JSON.parse(JSON.stringify(header.tempos));
  const state: ControllerState = {
    paused: true,
    time: 0,
    stop: false,
    duration: durationTicks / header.ppq,
    midifile: source,
    tempo: tempos[0],
    timeSignature: header.timeSignatures[0],
  };
  emitter.emit("#tempo", state.tempo.bpm);

  const setCallback = (_cb: CallbackFunction) => (cb = _cb);
  const setState = (update: { [key: string]: string | boolean | number }) => {
    Object.keys(update).forEach((k) => (state[k] = update[k]));
  };
  const controller: RemoteControl = {
    pause: () => setState({ paused: true }),
    resume: () => {
      setState({ paused: false });
      emitter.emit("resume");
    },
    seek: (_time: number) => setState({ time: _time }),
    stop: () => setState({ stop: true }),
    ff: () => setState({ time: state.time + 15 }),
    next: () => {},
    rwd: () => setState({ time: Math.max(state.time - 15, 0) }),
    emitter: emitter,
    start: () => {
      setState({ paused: false });
      pullMidiTrack({ tracks, _cb: cb });
    },
    setCallback,
    state,
    meta: {
      name: header.name,
      seconds: Math.floor(duration),
      ...(Object.values(header.meta).reduce((map, ele) => {
        map[ele.text] = ele["value"];
        return map;
      }, {}) || {}),
    },
  };

  const pullMidiTrack = async ({ tracks, _cb }: { tracks; _cb: CallbackFunction }) => {
    let done = 0;
    let doneSet = new Set();
    setState({ t0: process.uptime() });

    // const ticksPerSecond = (state.tempo.bpm / 60) * header.ppq;
    while (tracks.length > done) {
      const notesstarting: NoteEvent[] = [];
      const currentTick = header.secondsToTicks(state.time);
      for (let i = 0; i < tracks.length; i++) {
        if (doneSet.has(i)) continue;
        if (!tracks[i].notes || tracks[i].notes.length === 0) {
          doneSet.add(i);
          done++;
          continue;
        }
        if (tracks[i].notes[0] && tracks[i].notes[0].ticks <= currentTick) {
          const note = tracks[i].notes.shift();
          if (currentTick - note.ticks < 500) {
            const noteEvent = {
              ...note,
              name: note.name,
              trackId: i,
              instId: tracks[i].instrument.number,
              start: header.ticksToSeconds(note.ticks),
              durationTime: secondsPerTick(state.tempo.bpm) * note.durationTicks,
              velocity: note.velocity,
              instrument: std_inst_names[tracks[i].instrument.number],
            };
            notesstarting.push(noteEvent);
            emitter.emit("note", noteEvent);
          } else {
            //discarding notes too far i the past.. which is valid case in ff playback
          }
          const noteEvent = {
            ...note,
            name: note.name,
            trackId: i,
            instId: tracks[i].instrument.number,
            start: header.ticksToSeconds(note.ticks),
            durationTime: secondsPerTick(state.tempo.bpm) * note.durationTicks,
            velocity: note.velocity,
            instrument: std_inst_names[tracks[i].instrument.number],
          };
          notesstarting.push(noteEvent);
          emitter.emit("note", noteEvent);
        }
        if (tempos[1] && currentTick >= tempos[1].ticks) {
          tempos.shift();
          state.tempo = tempos[0];
          emitter.emit("#tempo", { bpm: state.tempo.bpm });
        }
      }
      let intval = Math.floor(state.time);
      state.time += await _cb(notesstarting);
      if (Math.floor(state.time) > intval) {
        emitter.emit("#time", { seconds: state.time });
      }
      if (state.paused) {
        await new Promise((resolve) => {
          emitter.once("resume", resolve);
        });
      }
      if (state.stop) break;
    }
    emitter.emit("end");
  };

  return controller;
}

export const convertMidiRealTime = (file) => {
  const controller = convertMidi(file, async function () {
    await sleep(10); //achieves real tiem by asking 'is it next beat yet every 10 ms
    return 0.01;
  });
  controller.start();
  return controller;
};

export const convertMidiASAP = (file: MidiFile) => {
  const controller = convertMidi(file, async function () {
    await sleep(0); //achieves real tiem by asking 'is it next beat yet every 10 ms
    return msPerBeat(controller.state.tempo.bpm) / 1000;
  });
  controller.start();
  return controller;
};

export const msPerBeat = (bpm) => 60000 / bpm;
export const secondsPerTick = (bpm) => 60 / bpm / 256;

function format(str) {
  return str.replace(" ", "_").replace(" ", "_").replace(" ", "_").replace(" ", "_");
}
