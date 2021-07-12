import {SF2File, readAB, PDTA, sfbkstream} from './esm/index.js';
mocha.setup('bdd');

describe('SF2file', () => {
  let pdta;
  before(async () => {
    const {pdtaBuffer} = await sfbkstream('file.sf2');
    pdta = new PDTA(readAB(pdtaBuffer));
    pdta.findPreset(0, 0, 55, 66).map(z => {
      console.log(z.sample);
    })
  });
  it('it should have pdta section ', async () => {
    chai.expect(pdta).exists;

  });
});

mocha.run();
