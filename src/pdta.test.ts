import { SF2File } from './sffile';
import test from 'ava';
import { assert } from 'console';
import { reader } from './reader';
test('pdta', (t) => {
  const {
    sections: {
      pdta: { pheaders, inst, presets, shdr },
    },
  } = new SF2File('./file.sf2');
  t.assert(pheaders instanceof Array);
  console.log(pheaders[0].pbags[0].pgens);

  t.assert(presets[0][0].name !== null);
  presets[0][0].zones.map((z) => {
    t.assert(z.sample != null);
    t.assert(z.sample.start >= 0);
    t.assert(z.pitchAdjust(70) < 2 * 2 * 2 * 2.0);
  });
  t.truthy(presets[128][0]);
  const r = reader('./file.sf2');
  const fsize = r.fstat().size;
  t.assert(shdr.every((sh) => sh.start * 2 < fsize));
});
