import test from 'ava';
import { assert } from 'console';
import { envAmplitue } from './envAmplitue';
import { SFGenerator } from './generator';
import { LUT } from './LUT';
import { Shdr } from './pdta';
import { sf_gen_id } from './sf.types';
import { SF2File } from './sffile';
import { SFZone } from './Zone';
new SF2File('sm.sf2');
const sample = {
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
};
test('1', (t) => {
  const zone = new SFZone();
  zone.applyGenVal(new SFGenerator(sf_gen_id.attackVolEnv, -1200));
  t.truthy(zone.volEnv);
});
