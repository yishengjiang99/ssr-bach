import { Midi, Track, Header } from "@tonejs/midi";
import { Note, NoteInterface } from "@tonejs/midi/dist/Note";
import { resolve } from "path";
import { Readable, Transform, Writable } from "stream";
import { EventEmitter } from "events";

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
  },
  donecb?
) {
  const emitter = new EventEmitter();
  let { output, realtime } = props;

  const sequenceArray = new Array(24).fill([]);

  const { tracks, header } = new Midi(require("fs").readFileSync(source));
  const state = {
    paused: false,
    time: 0,
  };

  output.write("#title, " + header.name + "\n");
  output.write(
    "#tempo, " +
      header.tempos[0].bpm +
      header.timeSignatures[0].timeSignature.join("/") +
      "\n"
  );
  emitter.emit("temp", {
    bmp: header.tempos[0].bpm,
    signature: header.timeSignatures[0].timeSignature,
  });

  pullMidiTrack(tracks, callback);

  async function pullMidiTrack(tracks, cb) {
    let now = 0;
    let done = 0;
    let doneSet = new Set();
    while (tracks.length > done) {
      const group = [];
      tracks.forEach((track, i) => {
        if (doneSet.has(i)) return;
        if (!track.notes || track.notes.length === 0) {
          doneSet.add(i);
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
      // output.write(`time:,${now},${header.ticksToMeasures(now)}\n`);
      const { abort, increment } = await cb(group, now);
      if (abort) break;

      now += increment;
    }

    donecb();
  }

  function currentTempo(now) {
    let shifted = false;
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

  async function callback(
    notes: NoteWithInstrument[],
    now: number
  ): Promise<{ increment: number; abort: boolean }> {
    const { beatLengthMs, ticksPerbeat, shifted } = currentTempo(now);
    if (shifted) {
      emitter.emit("temp", {
        bmp: header.tempos[0].bpm,
        signature: header.timeSignatures[0].timeSignature,
      });
    }
    while (notes.length) {
      const note = notes.shift();
      output.write(
        [
          "note",
          format(note.instrument),
          note.midi,
          note.ticks,
          note.durationTicks,
          note.velocity,
          "\n",
        ].join(",")
      );

      for (let i = 0; i < Math.ceil(note.durationTicks / ticksPerbeat); i++) {
        sequenceArray[i].push({
          note,
          envelopeIdx: i,
        });
      }
      sequenceArray.push([]);
    }
    let row = sequenceArray.shift();
    for (const note of row) {
      if (!note) continue;
      emitter.emit("beat", note);
    }
    sequenceArray.push([]);
    if (realtime) await sleep(beatLengthMs);
    return { increment: ticksPerbeat, abort: state.paused };
  }
}

if (require.main === module) {
  // convertMidi(
  //   "./midi/chpn_op10_e05-mid.mid",
  //   {
  //     output: process.stderr,
  //     realtime: false,
  //   },
  //   console.log
  // );
}
const format = (str) =>
  str.replace(" ", "_").replace(" ", "_").replace(" ", "_").replace(" ", "_");
