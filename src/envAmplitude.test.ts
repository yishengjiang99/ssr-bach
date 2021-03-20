import { envAmplitue } from './envAmplitue';
import test from 'ava';
import { assert } from 'console';
test('baisc', (t) => {
  const g = envAmplitue([-12000, -12000, -12000, -4000, -333], 333, 48000);
  t.is(g.stages.length, 5);
  t.assert(g.deltas[1] < 0);
  t.assert(g.deltas.every((d) => d != Infinity));

  console.log(g.deltas);
});
test('full attenuate during decay', (t) => {
  const g = envAmplitue([-12000, -12000, -12000, -4000, -333], 1000, 47);
  t.is(g.stages.length, 5);
  t.assert(g.deltas[1] < 0);
  t.assert(g.deltas.every((d) => d != Infinity));
  t.assert(g.deltas.every((d) => d != Infinity));
  Array.from(g.genDBVals()).map((v) => {
    t.assert(!v.isNaN);
  });
});
