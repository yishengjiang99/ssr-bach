import { Header, Midi, Track } from '@tonejs/midi';
import { Note } from '@tonejs/midi/src/Note';
import { readFileSync } from 'fs';
import { Writable } from 'stream';
import { SF2File } from './sffile';
import { ffp } from './sinks';
import { sleep } from './utilv1';
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
  const { durationTicks: totalTicks, tracks, header } = new Midi(
    readFileSync(source)
  );

  const tempos = header.tempos;
  let now = 0;
  let bpm = (tempos && tempos[0] && tempos[0].bpm) || 120;
  function registerNote(t: Track, note: Note) {
    sff.rend_ctx.keyOn(note.midi, note.velocity * 0x7f, 0, t.channel);
    setTimeout(() => sff.rend_ctx.keyOff(t.channel, 0), note.duration * 1000);
  }
  const ticksPerQuarterNote = header.ppq; // this is equivalent to a 1/4 note.
  let activeTracks = tracks;
  let framesize = 128; //for 350fps

  async function loop(bitdepth = 32) {
    const loopStart = process.uptime();
    const nowt = header.secondsToTicks(now / 1000);
    if (nowt > totalTicks) return;
    if (tempos.length > 1 && nowt >= tempos[1].ticks) {
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
        nowt >= t.controlChanges[midi_chan_vol_cc][0].ticks
      ) {
        sff.rend_ctx.chanVols[t.channel] =
          t.controlChanges[midi_chan_vol_cc][0].value;
      }
      while (t.notes.length && t.notes[0].time <= nowt) {
        const note = t.notes.shift();
        notesPlayed.push(registerNote(t, note));
        //console.log(note);
      }
    }
    await sleep(50);
    now = now + 0.05;
    loop();
  }
  tracks.map((t, i) => {
    sff.rend_ctx.programs[i] = {
      presetId: t.instrument.number,
      bankId: i == 9 ? 128 : 0,
    };
  });
  return { tracks, header, loop };
}
const sff = new SF2File('file.sf2');
const ff = ffp({ ar: 48000 });

loadMidi({
  source: process.argv[2] || 'c.mid',
  sff: sff,
  output: ff,
  sampleRate: 48000,
}).loop();
setInterval(() => {
  ff.write(sff.rend_ctx.render(128));
}, 3.5);
