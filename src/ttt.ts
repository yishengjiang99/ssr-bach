import { reader } from './reader';
import { openSync, writeFileSync } from 'fs';
writeFileSync('test111.txt', 'abcdefghijk');
const r = reader('./test111.txt');

console.log(r.seekToString('def'));
