import { Midi, Track, Header } from "@tonejs/midi";
import { Note, NoteInterface } from "@tonejs/midi/dist/Note";
import { resolve } from "path";
import { Readable, Transform, Writable } from "stream";
export const sleep = (ms: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

type state = {
  paused: boolean;
  ticks: number;
  time: number;
};
export async function convertMidi(
  source,
  output,
  props: {
    interrupt: Readable;
    realtime: boolean;
  }
) {
  const { interrupt, realtime } = props;
  interrupt.on("data", handleMessage);
  const readline = require("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
    prompt: "loading....",
  });

  const { tracks, header } = new Midi(require("fs").readFileSync(source));
  const state = {
    paused: false,
    time: 0,
  };
  rl.prompt("lets go");

  async function pullMidiTrack(tracks, cb) {
    let now = 0;
    let done = 0;
    while (tracks.length > done) {
      const group = [];
      tracks.forEach((track, i) => {
        if (!track.notes || track.notes.length === 0) {
          done++;
          return;
        }

        if (track.notes[0].ticks < now) {
          group.push({
            ...track.notes.shift(),
            ...track.instrument.name,
          });
        }
      });
      const { abort, increment } = await cb(now, group);
      if (abort) break;
      now += increment;
      rl.output.write("\n" + now);
    }
  }

  async function callback(
    notes,
    now
  ): Promise<{ increment: number; abort: boolean }> {
    function currentTempo(now) {
      if (header.tempos[1] && now >= header.tempos[1].ticks) {
        header.tempos.shift();
      }
      if (header.timeSignatures[1] && now >= header.timeSignatures[1].ticks) {
        header.timeSignatures.shift();
      }
      let ppb = header.ppq;
      let bpm = header.tempos[0]?.bpm || 120;
      let signature = header.timeSignatures[0].timeSignature;
      let beatLengthMs = 60000 / header.tempos[0].bpm;
      let ticksPerbeat = (header.ppq / signature[1]) * 4;
      return { ppb, bpm, ticksPerbeat, signature, beatLengthMs };
    }
    const { beatLengthMs, ticksPerbeat } = currentTempo(now);
    sequencer.addNew(notes, ticksPerbeat);
    sequencer.showCurrentRow();
    await sleep(beatLengthMs);
    return { increment: ticksPerbeat, abort: state.paused };
  }
  const sequenceArray = new Array(24).fill([]);
  const sequencer = {
    sequenceArray,
    showCurrentRow: () => {
      let row = sequenceArray.shift();
      for (const note of row) {
        rl.write(note);
      }

      row = null;

      sequenceArray.push([]);
    },
    addNew: (notes, ticksPerbeat) => {
      while (notes.length) {
        const note = notes.shift();
        for (let i = 0; i < Math.ceil(note.durationTicks / ticksPerbeat); i++) {
          sequenceArray[i].push({
            ...note,
            envelopeIdx: i,
          });
        }
      }
    },
  };
  function handleMessage(d) {
    const msg = d.toString().trim().split(" ");
    switch (msg[0]) {
      case "p":
        state.paused = true;
        output.write("\npaused");
        break;
      case "r":
        state.paused = false;
        output.write("\n resume");
        break;
      case "ff":
        state.paused = true;
        output.write("\nstopped");
        break;
    }
  }

  pullMidiTrack(tracks, callback);
}

// convertMidi("./song.mid", process.stderr, {
//   interrupt: process.stdin,
//   realtime: true,
// });
