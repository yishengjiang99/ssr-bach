import test from 'ava';
import { SF2File } from './sffile';

test('sffile is read', (t) => {
  const sf = new SF2File('./file.sf2');
  t.truthy(sf.pdta.shdr);
  t.truthy(sf.pdta.shdr);
  t.truthy(sf.pdta.iheaders);
  t.truthy(sf.sdta.data);
  for (let key = 21; key < 99; key++) {
    const z = sf.findPreset({ bankId: 0, presetId: 0, key: key, vel: 55 })[0];
    t.truthy(z);
  }
});
