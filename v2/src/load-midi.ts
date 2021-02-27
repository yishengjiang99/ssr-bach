import { Midi, Track } from "@tonejs/midi";
import { Note } from "@tonejs/midi/src/Note";
import { readFileSync } from "fs";

export type TNote = {
  note: Note;
  track: Track;
};
export type Callback = (note: TNote[]) => Promise<number>;
export async function loadMidi(source: string, cb: Callback) {
  const { durationTicks, tracks, header } = new Midi(readFileSync(source));
  let ticks = 0;

  while (ticks <= durationTicks) {
    let batch: TNote[] = [];
    for (const t of tracks) {
      if (t.notes.length && t.notes[0].ticks < ticks) {
        batch.push({
          note: t.notes.shift(),
          track: t,
        });
      }
    }
    const advance = await cb(batch);
    ticks += header.secondsToTicks(advance);
  }
}
