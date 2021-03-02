import { Header, Midi, Track } from "@tonejs/midi";
import { Note } from "@tonejs/midi/src/Note";
import { readFileSync } from "fs";
import { Writable } from "stream";
import { SF2File } from "./sffile";

export function loadMidi(
  source: string,
  sff: SF2File,
  output: Writable,
  sampleRate: number
) {
  const { durationTicks: totalTicks, tracks, header } = new Midi(readFileSync(source));
  const gainchs = tracks.map((t) => {
    t.controlChanges[7];
  });
  const tempos = header.tempos;
  let now = 0;
  let bpm = tempos[0].bpm || 120;
  function registerNote(t: Track, note: Note) {
    console.log(t.instrument.name, note.midi, note.duration, note.ticks);

    sff.keyOn(
      {
        bankId: t.instrument.percussion ? 128 : 0,
        presetId: t.instrument.number,
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

  function loop() {
    const loopStart = process.uptime();
    if (now > totalTicks) return;
    if (tempos.length > 1 && now >= tempos[1].ticks) {
      tempos.shift();
      bpm = tempos[0].bpm;
    }
    let nextCycleStart = null;
    for (const t of activeTracks) {
      if (
        t.controlChanges &&
        t.controlChanges[7] &&
        t.controlChanges[7].length &&
        now >= t.controlChanges[7][0].ticks
      ) {
        sff.ccVol(t.channel, t.controlChanges[7][0].value);
        t.controlChanges[7].shift();
      }

      while (t.notes.length && t.notes[0].ticks <= now) {
        const note = t.notes.shift();
        registerNote(t, note);
      }
      if (t.notes.length) {
        nextCycleStart = !nextCycleStart
          ? t.notes[0].ticks
          : Math.min(nextCycleStart, t.notes[0].ticks);
      }
    }
    const milisecondsToNextCycle =
      (nextCycleStart - now) * (60000 / bpm / ticksPerQuarterNote);
    let framesToREnder = (milisecondsToNextCycle * sampleRate) / 1000;
    // while (framesToREnder > framesize) {
    //   output.write(sff.render(framesToREnder));
    //   framesToREnder -= framesize;
    // }
    output.write(sff.render(~~framesToREnder));

    const elapsedCycleTime = process.uptime() - loopStart;
    if (elapsedCycleTime * 1000 > milisecondsToNextCycle) {
      console.error("LAG!!");
      framesize += 20;
      if (framesize > 1280) throw "find a new outlet";
    }

    now = nextCycleStart;
    setTimeout(loop, milisecondsToNextCycle);
  }

  return { tracks, header, loop };
}
