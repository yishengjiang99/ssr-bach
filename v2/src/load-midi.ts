import { Header, Midi, Track } from "@tonejs/midi";
import { Note } from "@tonejs/midi/src/Note";
import { readFileSync } from "fs";
import { Writable } from "stream";
import { SF2File } from "./sffile";
const midi_chan_vol_cc = 11;
const midi_mast_vol_cc = 7;
interface loadMidiProps {
  source: string;
  sff: SF2File;
  output: Writable;
  sampleRate?: number;
  debug?: boolean;
}
export function loadMidiaa(
  source: string,
  sff: SF2File,
  output: Writable,
  sampleRate: number
) {
  return loadMidi({ source, sff, output, sampleRate });
}
export function loadMidi({
  source,
  sff,
  output,
  sampleRate,
  debug,
}: loadMidiProps): {
  loop: (bitdepth?: number) => any;
  tracks: Track[];
  header: Header;
} {
  const { durationTicks: totalTicks, tracks, header } = new Midi(readFileSync(source));

  const tempos = header.tempos;
  let now = 0;
  let bpm = (tempos && tempos[0] && tempos[0].bpm) || 120;
  function registerNote(t: Track, note: Note) {
    return sff.keyOn(
      {
        bankId: t.instrument.percussion ? 128 : 0,
        presetId: 0,
        key: note.midi,
        vel: note.velocity * 0x7f,
      },
      note.duration,
      t.channel
    );
  }
  const ticksPerQuarterNote = header.ppq; // this is equivalent to a 1/4 note.
  let activeTracks = tracks;
  let framesize = 128; //for 350fps

  async function loop(bitdepth = 32) {
    const loopStart = process.uptime();
    if (now > totalTicks) return;
    if (tempos.length > 1 && now >= tempos[1].ticks) {
      tempos.shift();
      bpm = tempos[0].bpm;
    }
    let nextCycleStart = null;
    let notesPlayed = [];

    for (const t of activeTracks) {
      if (
        t.controlChanges &&
        t.controlChanges[midi_chan_vol_cc] &&
        t.controlChanges[midi_chan_vol_cc].length &&
        now >= t.controlChanges[midi_chan_vol_cc][0].ticks
      ) {
        sff.ccVol(t.channel, t.controlChanges[midi_chan_vol_cc][0].value);
        t.controlChanges[midi_chan_vol_cc].shift();
      }
      while (t.notes.length && t.notes[0].ticks <= now) {
        const note = t.notes.shift();
        notesPlayed.push(registerNote(t, note));
        // if (!nextCycleStart) nextCycleStart = t.notes[0].duration;
      }
      if (t.notes.length) {
        nextCycleStart = !nextCycleStart
          ? t.notes[0].ticks
          : Math.min(nextCycleStart, t.notes[0].ticks);
      }
    }
    if (notesPlayed.length) {
    }
    const milisecondsToNextCycle =
      (nextCycleStart - now) * (60000 / bpm / ticksPerQuarterNote);
    let framesToREnder = (milisecondsToNextCycle * sampleRate) / 1000;
    let b = framesToREnder;
    while (framesToREnder >= 2 * framesize) {
      if (!output.destroyed) output.write(sff.render(2 * framesize));
      framesToREnder -= 2 * framesize;
    }

    if (!output.destroyed) output.write(sff.render(framesize));

    const elapsedCycleTime = process.uptime() - loopStart;
    if (elapsedCycleTime * 1000 > milisecondsToNextCycle) {
      console.error("LAG!!");
      // framesize += 20;
      // if (framesize > 1280) throw "find a new outlet";
    }
    console.log("frames:", b);
    console.log("took (ms)", elapsedCycleTime * 1000);
    console.log("sleep", milisecondsToNextCycle);

    await new Promise((resolve) =>
      setTimeout(resolve, milisecondsToNextCycle - elapsedCycleTime * 1000)
    );
    now = nextCycleStart;
    if (nextCycleStart == null) {
      output.end();
      return;
    }
    loop();
  }

  return { tracks, header, loop };
}
