import test from 'ava';
import { parsePDTA } from './pdta';
import { reader } from './reader';
test('reader.seekToString', (t) => {
  const r = reader('./sm.sf2');
  t.truthy(r);
  r.seekToString('pdta');
  const p = parsePDTA(r);
  console.log(p.presets['0']['0']);
});
