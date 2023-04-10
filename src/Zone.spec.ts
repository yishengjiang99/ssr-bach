import test from 'ava';
import { SFGenerator } from './generator';
import { sf_gen_id } from './sf.types';
import { SFZone } from './Zone';
const sample = [
  {
    name: 'SineWave',
    start: 430271,
    end: 430410,
    startLoop: 430340,
    endLoop: 430406,
    sampleRate: 44100,
    originalPitch: 60,
    pitchCorrection: 0,
    sampleLink: 0,
    sampleType: 32769,
  },
];

test('mk envelope', (t) => {
  const zone: SFZone = new SFZone();

  zone.applyGenVal(new SFGenerator(sf_gen_id.attackVolEnv, -1200));
  t.truthy(zone.volEnv);
  t.assert(zone.volEnv.phases.attack == -1200);
  zone.applyGenVal(new SFGenerator(sf_gen_id.attackModEnv, -1200));
  t.assert(zone.modEnv.phases.attack == -1200);
});
test('apply pitch with coarse/fine tuning', (t) => {
  const zone = new SFZone();
  zone.applyGenVal(new SFGenerator(sf_gen_id.sampleID, 0));
  zone.sample = sample[0];
  t.truthy(zone.sample);
  t.assert(zone.pitch == sample[0].originalPitch * 100);
  zone.applyGenVal(new SFGenerator(sf_gen_id.coarseTune, 1));
  t.assert(zone.pitch == sample[0].originalPitch * 100 + 100);
  zone.applyGenVal(new SFGenerator(sf_gen_id.fineTune, 1));
  t.assert(zone.pitch == sample[0].originalPitch * 100 + 100 + 1);
});
