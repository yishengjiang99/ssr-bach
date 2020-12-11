import { Midi, Track, Header } from "@tonejs/midi";
import { Note, NoteInterface } from "@tonejs/midi/dist/Note";
import { resolve } from "path";
import { Readable, Transform, Writable } from "stream";
export const sleep = (ms: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

type NoteWithInstrument = Note & {
  instrument: string;
};
export async function convertMidi(
  source,
  props: {
    output: Writable;
    interrupt?: Readable;
    realtime?: boolean;
  }
) {
  let { output, interrupt, realtime } = props;
  interrupt = interrupt || process.stdin;
  interrupt.on("keydown", handleMessage);
  const readline = require("readline");
  const rl = readline.createInterface({
    input: interrupt,
    output: output,
    terminal: true,
    prompt: "loading....",
  });
  let lastRow;
  const sequenceArray = new Array(24).fill([]);

  const { tracks, header } = new Midi(require("fs").readFileSync(source));
  const state = {
    paused: false,
    time: 0,
  };

  output.write("#title: " + header.name + "\n");
  output.write("\n#tempo:\t" + header.tempos[0].bpm);
  output.write(
    "\n#signature:\t" + header.timeSignatures[0].timeSignature.join("/")
  );

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
            instrument: track.instrument.name,
          });
        }
      });
      output.write("\ntime: " + now + " " + header.ticksToMeasures(now));
      const { abort, increment } = await cb(group, now);
      if (abort) break;
      now += increment;
    }
  }

  function currentTempo(now) {
    if (header.tempos[1] && now >= header.tempos[1].ticks) {
      header.tempos.shift();
    }
    if (header.timeSignatures[1] && now >= header.timeSignatures[1].ticks) {
      header.timeSignatures.shift();
    }
    let ppb = header.ppq;
    let bpm = header.tempos[0].bpm || 120;
    let signature = header.timeSignatures[0].timeSignature;
    let beatLengthMs = 60000 / header.tempos[0].bpm;
    let ticksPerbeat = (header.ppq / signature[1]) * 4;
    return { ppb, bpm, ticksPerbeat, signature, beatLengthMs };
  }

  async function callback(
    notes: NoteWithInstrument[],
    now: number
  ): Promise<{ increment: number; abort: boolean }> {
    const { beatLengthMs, ticksPerbeat } = currentTempo(now);

    addNotes(notes, ticksPerbeat);
    showCurrentRow();
    if (realtime) await sleep(beatLengthMs);

    return { increment: ticksPerbeat, abort: state.paused };
  }
  const format = (str) =>
    str.replace(" ", "_").replace(" ", "_").replace(" ", "_").replace(" ", "_");

  const addNotes = (notes: NoteWithInstrument[], ticksPerbeat: number) => {
    while (notes.length) {
      const note = notes.shift();
      output.write(
        `\n` +
          [
            format(note.instrument),
            note.midi,
            note.ticks,
            note.durationTicks,
            note.velocity,
          ]
      );

      for (let i = 0; i < Math.ceil(note.durationTicks / ticksPerbeat); i++) {
        sequenceArray[i].push({
          note,
          envelopeIdx: i,
        });
      }
      sequenceArray.push([]);
    }
  };

  const showCurrentRow = () => {
    let row = sequenceArray.shift();
    for (const note of row) {
      if (!note) continue;
    }

    if (row) {
      lastRow = row;
    }
    sequenceArray.push([]);
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
      case "q":
        process.exit();

        break;
      case "l":
        state.paused = true;
        output.write("\nlastrow: " + JSON.stringify(lastRow, null, "\t"));
      case "ff":
        state.paused = true;
        output.write("\nstopped");
        break;
    }
  }

  pullMidiTrack(tracks, callback);
  return 0;
}

// if (require.main === module) {
//   convertMidi("./song.mid", {
//     output: process.stderr,
//     interrupt: process.stdin,
//     realtime: true,
//   });
// }
