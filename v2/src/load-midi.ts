import { Track, Midi } from "@tonejs/midi";
import { EventEmitter } from "events";

import { readFileSync } from "fs";
import {
  RemoteControl,
  MidiFile,
  ControllerState,
  CallbackFunction,
} from "./ssr-remote-control.types";
import { NoteEvent } from "./NoteEvent";
import { sleep } from "./utils";

export function convertMidi(source: MidiFile, cb?: CallbackFunction): RemoteControl {
  const emitter = new EventEmitter();
  const { duration, durationTicks, tracks, header } = new Midi(readFileSync(source));
  const tempos = JSON.parse(JSON.stringify(header.tempos));
  const state: ControllerState = {
    paused: true,
    time: 0,
    stop: false,
    tracks: tracks,
    duration: durationTicks / header.ppq,
    midifile: source,
    tempo: tempos[0] || { bpm: 60 },
    timeSignature: header.timeSignatures[0],
  };

  function setCallback(_cb: CallbackFunction) {
    return (cb = _cb);
  }
  function setState(update: { [key: string]: string | boolean | number }) {
    Object.keys(update).forEach((k) => (state[k] = update[k]));
  }
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
      pullMidiTrack({ tracks, callback: cb });
    },
    setCallback,
    state,
  };

  const pullMidiTrack = async ({
    tracks,
    callback,
  }: {
    tracks: Track[];
    callback: CallbackFunction;
  }): Promise<void> => {
    let done = 0;
    let doneSet = new Set();

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
        const { percussion, number, family } = tracks[i].instrument;
        if (tracks[i].notes[0] && tracks[i].notes[0].ticks <= currentTick) {
          const note = tracks[i].notes.shift();
          if (currentTick - note.ticks < 500) {
            const noteEvent = {
              ...note,
              name: note.name,
              trackId: i,
              channelId: tracks[i].channel, //tracks[i].instrument.number,
              start: header.ticksToSeconds(note.ticks),
              durationTime: secondsPerTick(state.tempo.bpm) * note.durationTicks,
              velocity: note.velocity,
              instrument: { percussion, number, family },
            };
            notesstarting.push(noteEvent);
            emitter.emit("note", noteEvent);
          } else {
            //discarding notes too far i the past.. which is valid case in ff playback
          }
        }
        if (tempos[1] && currentTick >= tempos[1].ticks) {
          tempos.shift();
          state.tempo = tempos[0];
          emitter.emit("#tempo", { bpm: state.tempo.bpm });
        }
      }
      let intval = Math.floor(state.time);
      emitter.emit("notes", notesstarting);

      state.time += await callback(notesstarting);

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
