import test from 'ava';
import { execSync } from 'child_process';
import { parsePDTA } from './pdta';
import { reader } from './reader';
import * as sfTypes from './sf.types';
import { SF2File } from './sffile';
const pdtaoffset = execSync('strings -o file.sf2|grep pdta')
  .toString()
  .trim()
  .split(/S+/)[0];
const nitoff = parseInt(pdtaoffset);

test('pdta parse', (t) => {
  const r = reader('file.sf2');
  const sff = new SF2File('file.sf2');
  const pdta = sff.sections.pdta;
  t.truthy(pdta);

  Object.values(pdta.presets[0]).map(function (p: sfTypes.Preset) {
    p.zones.map((z) => {
      t.truthy(z.generators);
    });
    // t.truthy(p.defaultBag);
  }); //.defaultBag
});
