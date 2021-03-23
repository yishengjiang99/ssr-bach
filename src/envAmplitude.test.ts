import { Envelope } from './envAmplitue';
import test from 'ava';
import { readFileSync } from 'fs';
import { assert } from 'console';
import { SF2File } from './sffile';
import { centidb2gain } from './centTone';
test('baisc', (t) => {
  const g = Envelope([-12000, -12000, -12000, -4000, -333], 333, 48000);
  t.is(g.stages.length, 5);
  t.assert(g.deltas.every((d) => d != Infinity));

  console.log(g.deltas);
});
test('full attenuate during decay', (t) => {
  const g = Envelope([-12000, -12000, -12000, -4000, -333], 1000, 47);
  t.is(g.stages.length, 5);
  t.assert(g.deltas[1] > 0);
  t.assert(g.deltas.every((d) => d != Infinity));
  t.assert(g.deltas.every((d) => d != Infinity));
  Array.from(g.genDBVals()).map((v: number) => {
    t.assert(v != NaN);
  });
});
test('piano', (t) => {
  const sff = new SF2File('file.sf2');
  const vol = sff.findPreset({ bankId: 0, presetId: 0, key: 60, vel: 70 })[0]
    .volEnv;
  const sr = 48000;
  const {
    phases: { delay, attack, hold, decay, release },
    sustain,
  } = vol;
  const g = Envelope([delay, attack, hold, decay, release], sustain, sr);
  t.is(g.stages[0], Math.pow(2, vol.phases.hold / 1200) * sr);
  for (const v of g.genDBVals()) {
    //  console.log(v);
    //   console.log(centidb2gain(v));
  }
});
