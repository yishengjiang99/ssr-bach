import { envAmplitue } from './envAmplitue';
import test from 'ava';

const g = envAmplitue([-12000, -12000, -12000, -4000, -333], 333, 48000);
let c = Math.pow(2, -1200 / 1200);
console.log(g.next().value, g.next().done);
let value, done;
while (({ value, done } = g.next())) {
  if (done) break;
  console.log(value);
}
console.log(g.next().value);
console.log(g.next().value);
console.log(g.next().value);
console.log(g.next().value);
