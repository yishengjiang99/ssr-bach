import test from 'ava';
import { LUT } from './LUT';
import { loop } from './Utils';
test('its init on import', (t) => {
  t.assert(LUT.absTC.length > 1000);
});
test('timecent', (t) => {
  t.assert(LUT.centtime2sec(-1200) == 0.5);
  t.assert(LUT.centtime2sec(1200) == 2);
  t.assert(LUT.centtime2sec(1200) == 2);
});
test('midicb', (t) => {
  t.assert(LUT.midi2cb(3) > LUT.midi2cb(5));
  loop(127, (n) => console.log(n, LUT.midi2cb(n), LUT.getAmp(LUT.midi2cb(n))));
});
