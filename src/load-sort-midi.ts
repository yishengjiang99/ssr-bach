import { Header, Midi } from "@tonejs/midi";
import { DrumKitByPatchID } from "@tonejs/midi/dist/InstrumentMaps";
import { EventEmitter } from "events";

import { createWriteStream, readFileSync } from "fs";
import {
  Filename,
  RemoteControl,
  MidiFile,
  NoteEvent,
  ControllerState,
  CallbackFunction,
  Ticks,
} from "./ssr-remote-control.types";
import { sleep, std_drums, std_inst_names } from "./utils";

export function convertMidi(source: MidiFile, cb?: CallbackFunction): RemoteControl {
  const emitter = new EventEmitter();
  const { duration, durationTicks, tracks, header } = new Midi(readFileSync(source));
  const tempos = JSON.parse(JSON.stringify(header.tempos));
  const state: ControllerState = {
    paused: true,
    time: 0,
    stop: false,
    tracks: tracks.map((t, i) => ({
      trackId: t.channel,
      percussion: t.instrument.percussion,
      instrument: t.instrument.number,
      mute: false,
    })),
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
    meta: {
      name: header.name,
      seconds: Math.floor(duration),
      ...(Object.values(header.meta).reduce((map, ele) => {
        map[ele + ""] = ele["value"];
        return map;
      }, {}) || {}),
    },
  };

  type NewType = {
    tracks;
    callback: CallbackFunction;
  };

  const pullMidiTrack = async ({ tracks, callback }: NewType): Promise<void> => {
    let done = 0;
    let doneSet = new Set();

    // const ticksPerSecond = (state.tempo.bpm / 60) * header.ppq;
    while (tracks.length > done) {
      const notesstarting: NoteEvent[] = [];
      const tickWindow = header.secondsToTicks(state.time + 0.5);
      const currentTick = header.secondsToTicks(state.time);

      for (let i = 0; i < tracks.length; i++) {
        if (doneSet.has(i)) continue;
        if (!tracks[i].notes || tracks[i].notes.length === 0) {
          doneSet.add(i);
          done++;
          continue;
        }
        while (tracks[i].notes[0] && tracks[i].notes[0].ticks <= tickWindow) {
          const note = tracks[i].notes.shift();
          const noteEvent = {
            ...note,
            name: note.name,
            trackId: tracks[i].channel,
            channelId: tracks[i].channel, //tracks[i].instrument.number,
            start: header.ticksToSeconds(note.ticks),
            durationTime: secondsPerTick(state.tempo.bpm) * note.durationTicks,
            velocity: note.velocity,
            instrumentNumber:
              tracks[i].channel === 9
                ? std_drums[tracks[i].instrument.number]
                : tracks[i].instrument.number,
            instrument: std_inst_names[tracks[i].instrument.number],
          };
          notesstarting.push(noteEvent);
          emitter.emit("note", noteEvent);

          //console.log("adding ", noteEvent.channelId, noteEvent.start);
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

export function convertMidiRealTime(file): RemoteControl {
  const controller = convertMidi(file, async function () {
    await sleep(10); //achieves real tiem by asking 'is it next beat yet every 10 ms
    return 0.01;
  });
  controller.start();
  return controller;
}

export const convertMidiASAP = (file: MidiFile): RemoteControl => {
  const controller = convertMidi(file, async function () {
    // await sleep(0); //achieves real tiem by asking 'is it next beat yet every 10 ms
    return 0.1;
  });
  controller.start();
  return controller;
};

export const msPerBeat = (bpm) => 60000 / bpm;
export const secondsPerTick = (bpm) => 60 / bpm / 256;

function format(str) {
  return str.replace(" ", "_").replace(" ", "_").replace(" ", "_").replace(" ", "_");
}
