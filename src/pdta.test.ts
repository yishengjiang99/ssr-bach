import { execSync } from 'child_process';
import { parsePDTA, readPdta } from './pdta';
import { reader } from './reader';
import * as sfTypes from './sf.types';
import { SF2File } from './sffile';
import { expect } from 'chai';

describe('s', () => {
  it('ss', () => {
    expect(true);
  });
});
// });
// desc('pdta phdr contains list of pbags', (t) => {
//   t.pass();
//   const pdtaoffset = execSync('strings -o sm.sf2|grep pdta')
//     .toString()
//     .trim()
//     .split(/S+/)[0];
//   const nitoff = parseInt(pdtaoffset);
//   const r = reader('sm.sf2');
//   r.setOffset(nitoff);
//   const { pheaders } = readPdta(r);
//   t.truthy(pheaders);
//   t.truthy(pheaders[0].pbags[0]);
// });
// test('pdta parse', (t) => {
//   const r = reader('file.sf2');
//   const sff = new SF2File('file.sf2');
//   const pdta = sff.sections.pdta;
//   t.truthy(pdta);

//   Object.values(pdta.presets[0]).map(function (p: sfTypes.Preset) {
//     p.zones.map((z) => {
//       t.truthy(z.generators);
//     });
//     // t.truthy(p.defaultBag);
//   }); //.defaultBag
// });
