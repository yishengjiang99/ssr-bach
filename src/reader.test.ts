import test from 'ava';
import { reader } from './reader';
import { openSync, writeFileSync } from 'fs';
import assert from 'assert';
test('reader.seekToString', (t) => {
  writeFileSync('test111.txt', 'abcdefghijk');
  const r = reader('./test111.txt');
  t.truthy(r);

  t.assert(r.seekToString('def') == 3);
});
