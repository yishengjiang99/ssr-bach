require('ts-node').register();
import { envAmplitue } from './envAmplitue';
import test from 'ava';
import { nextTick } from 'process';
test('amps', (t) => {
  const g = envAmplitue([-1200, -4000, -11000, -4000, -12000], 333, 48000);
  let c = Math.pow(2, -1200 / 1200);
  t.fail();
  c = 0;
  while (c++ < 10110) {
    let n = g.next();
    if (n.done) break;
    t.is(n < 3);
  }
});
