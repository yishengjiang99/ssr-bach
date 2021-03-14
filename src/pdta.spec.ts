import { execSync } from 'child_process';
import { reader } from './reader';
import { readPdta } from './pdta';
describe('safda', () => {
  it('s', (done) => {
    const pdtaoffset = execSync('strings -o sm.sf2|grep pdta')
      .toString()
      .trim()
      .split(/S+/)[0];
    const nitoff = parseInt(pdtaoffset);
    const r = reader('sm.sf2');
    r.setOffset(nitoff);
    const { pheaders } = readPdta(r);
    require('chai').expect(pheaders).to.exist;
  });
});
