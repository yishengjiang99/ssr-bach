import { SF2File, SampleData } from './dist/index.js';
mocha.setup('bdd');

describe('SF2file', () => {
  let sdta, pdta;
  before(async () => {
    const sff = await SF2File.fromURL('sm.sf2');
    sdta = sff.sdta;
    pdta = sff.pdta;
  });
  it('it should have sdta section witbh floatarrr', async () => {
    const { data, floatArr } = sdta;
    chai.expect(sdta.data).exists;
    chai.expect(new Float32Array(floatArr)).exists;
    chai.expect(new Float32Array(floatArr).length).eq(data.length / 2); //.exists;
  });
  it('floats are not messed up', () => {
    const { data, floatArr } = sdta;

    new Float32Array(floatArr).forEach((f) => {
      chai.expect(f).lte(1.0);
    });
  });
  it('at least half the floats are non zero', () => {
    const { data, floatArr, nSamples } = sdta;
    chai.expect(
      new Float32Array(floatArr).filter((f) => {
        f > 0;
      }).length
    ) >=
      nSamples / 2;
  });

  it('sffile.sdta.iterator over sample data for a given zone applied to a midikey', () => {
    const { iterator } = sdta;
    pdta.findPreset(0, 0)[0];
    //  iterator(pdta.findPreset(0, 0)[0], 44, 48000);
    for (const f of iterator(pdta.findPreset(0, 0)[0], 44, 48000)) {
      chai.expect(!isNaN(f) && f < 1.1);
    }
    import('./node_modules/draw-canvas-60fps/index.js').then(() =>
      draw(Array.from(iterator(pdta.findPreset(0, 0)[0], 44, 48000))).drawOnce()
    );
  });
});

mocha.run();
