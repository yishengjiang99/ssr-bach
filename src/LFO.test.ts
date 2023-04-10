import test from 'ava';
import { LFO } from './LFO';
test('LFO', (t) => {
  const l = new LFO(1200, 1200, {
    volume: 1200,
    pitch: 122,
    filter: 33,
  });

  t.assert(l.val == 0);
});