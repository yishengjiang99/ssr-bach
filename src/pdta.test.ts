import { SF2File } from './sffile';
import test from 'ava';
import { assert } from 'console';
test('pdta', (t) => {
  const {
    sections: {
      pdta: { pheaders, inst, presets },
    },
  } = new SF2File('./file.sf2');
  t.assert(pheaders instanceof Array);
  console.log(pheaders[0].pbags[0].pgens);
});
