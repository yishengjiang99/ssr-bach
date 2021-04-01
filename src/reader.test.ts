import test from 'ava';
import { reader } from './reader';
import { openSync, writeFileSync } from 'fs';
test('reader.seekToString', (t) => {
  writeFileSync('test111.txt', 'abcdefghijk');
  const r = reader('./test111.txt');
  t.truthy(r);
  r.seekToString('def');
  console.log(r.getOffset());
  t.assert(r.getOffset() == 3);
});
