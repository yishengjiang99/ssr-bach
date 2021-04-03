import { SF2File } from './sffile';
import test from 'ava';
import { reader } from './reader';
import { readFileSync } from 'fs';
import { performance, PerformanceObserver } from 'perf_hooks';
import { SFfromUrl } from './SFBK';

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
  t.truthy(pdta.findPreset(44));
  const r = reader('./file.sf2');
});
test('pdta find presetsm', (t) => {
  const { pdta } = new SF2File('./file.sf2');
  [1, 2, 3, 4, 5, 6].map((p) => {
    const inst = pdta.findPreset(p, 0);
    t.assert(inst.length > 0);
    [55, 34, 56, 22, 33, 77].map((k) => {
      const z = pdta.findPreset(p, 0, k, 66);
      t.assert(z && z[0].keyRange.lo <= k);
    });
  });
});
test('pdta streess', (t) => {
  const perfObserver = new PerformanceObserver((items) => {
    items.getEntries().forEach((entry) => {
      entry.duration < 0.001; // fake call to our custom logging solutiontsc
      //console.log(entry);
    });
  });

  perfObserver.observe({ entryTypes: ['measure'], buffered: true });
  performance.mark('read-start');
  const { pdta } = new SF2File('./file.sf2');
  performance.mark('read-end');
  performance.measure('read', 'read-start', 'read-end');
  performance.mark('readmid-start');
  const buf = readFileSync('./midi/song.mid');
  performance.mark('readmid-end');
  performance.measure('readmid', 'readmid-start', 'readmid-end');

  // new Midi(buf).tracks.map((t) => {
  //   const instt = t.instrument.number;
  //   t.notes.map((n) => {
  //     performance.mark('load-start');
  //     const p = pdta.findPreset(instt, 0, n.midi, n.velocity * 0x7f);
  //     performance.mark('load-end');
  //     performance.measure('load' + n.ticks, 'load-start', 'load-end');
  //   });
  // });
  t.pass();
});

test.only('fetchwith url', async (t) => {
  SFfromUrl(
    'https://grep32bit.blob.core.windows.net/sf2/SoundBlasterOld.sf2'
  ).then(({ pdta, sdta: { data }, runtime }) => {
    //console.log(runtime(0, 54, 22, 0));
    t.truthy(runtime(0, 54, 22, 0));
  });
  SFfromUrl('https://dsp.grepawk.com/ssr-bach/Chaos.sf2')
    .then((res) => {
      t.truthy(res.runtime(83, 44, 33)[0].zone.sampleID);
    })
    .catch((e) => {
      console.error(e);
    });
});
