import { SF2File } from './sffile';
import test from 'ava';
import { assert } from 'console';
import { reader } from './reader';
test('pdta', (t) => {
  const { pdta } = new SF2File('./file.sf2');
  t.assert(pdta.phdr instanceof Array);
  const presets = pdta.findPreset(0);
  t.assert(pdta.findPreset(0)[0].sample.name != null); // [0][0].name !== null);
  presets.map((z) => {
    t.assert(z.sample != null);
    t.assert(z.sample.start >= 0);
    t.assert(z.pitch != NaN);
  });
  t.truthy(pdta.findPreset(128));
  const r = reader('./file.sf2');
  const fsize = r.fstat().size;
  t.assert(pdta.shdr.every((sh) => sh.start * 2 < fsize));
});
