import test from 'ava';
import { SF2File } from './sffile';
import { odf } from './sinks';

test('sffile is read', (t) => {
  const sf = new SF2File('./file.sf2');
  t.truthy(sf.pdta.shdr);
  t.truthy(sf.pdta.shdr);
  t.truthy(sf.pdta.iheaders);
  t.truthy(sf.sdta.data);
  for (let key = 55; key < 67; key++) {
    console.log(key);
    const z = sf.findPreset({ bankId: 0, presetId: 0, key: key, vel: 55 })[0];
    t.truthy(z);
  }
});
test('floats are parsed correctly is read', (t) => {
  const sf = new SF2File('file.sf2');
  t.truthy(sf.sdta.nsamples);
  t.is(sf.sdta.data.byteLength, 4 * sf.sdta.nsamples);
});
test.only('read via wash', async (t) => {
  const ab = await SF2File.fromURL(
    'http://localhost/ssr-bach/sf2/GeneralUserGS.sf2'
  );

  t.assert(
    ab.sdta.data.byteLength -
      new SF2File('./sf2/GeneralUserGS.sf2').sdta.data.byteLength <
      20
  );
  odf().write(ab.sdta.data);

  t.assert(true);
});
