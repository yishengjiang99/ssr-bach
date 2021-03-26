import { SF2File } from './sffile';
import test from 'ava';
import { reader } from './reader';
import { loadMidi, loadMidiaa } from './load-midi';
import { Midi } from '@tonejs/midi';
import { readFile, readFileSync } from 'fs';
const { performance, PerformanceObserver } = require('perf_hooks');

test('pdta', (t) => {
  const { pdta } = new SF2File('./file.sf2');
  t.assert(pdta.phdr instanceof Array);
  const presets = pdta.findPreset(0);
  t.assert(presets[0].sample.name != null); // [0][0].name !== null);
  presets.map((z) => {
    t.assert(z.sampleOffsets != null);
    t.assert(z.sampleOffsets.start >= 0);
    t.assert(z.pitch != NaN);
  });
  t.truthy(pdta.findPreset(128));
  const r = reader('./file.sf2');
  const fsize = r.fstat().size;
  t.assert(pdta.shdr.every((sh) => sh.start * 2 < fsize));
});
test.only('pdta find presetsm', (t) => {
  const { pdta } = new SF2File('./file.sf2');
  [1, 2, 3, 4, 5, 6, 6, 3, 1, 2, 3, 6, 6].map((p) =>
    t.assert(pdta.findPreset(p, 44).length > 0)
  );
});
test('pdta streess', (t) => {
  const perfObserver = new PerformanceObserver((items) => {
    items.getEntries().forEach((entry) => {
      entry.duration < 0.001; // fake call to our custom logging solution
    });
  });

  perfObserver.observe({ entryTypes: ['measure'], buffer: true });
  performance.mark('read-start');
  const { pdta } = new SF2File('./file.sf2');
  performance.mark('read-end');
  performance.measure('read', 'read-start', 'read-end');
  performance.mark('readmid-start');
  const buf = readFileSync('./midi/song.mid');
  performance.mark('readmid-end');
  performance.measure('readmid', 'readmid-start', 'readmid-end');

  new Midi(buf).tracks.map((t) => {
    const instt = t.instrument.number;
    t.notes.map((n) => {
      performance.mark('load-start');
      const p = pdta.findPreset(instt, 0, n.midi, n.velocity * 0x7f);
      performance.mark('load-end');
      performance.measure('load' + n.ticks, 'load-start', 'load-end');
    });
  });
  t.pass();
});
