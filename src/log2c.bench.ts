import { load } from 'webassembly';
import { performance, PerformanceObserver } from 'perf_hooks';

const logtb = [];
for (let i = 0; i < 128; i++) {
  logtb[i] = Math.log2(i + 128) * 0x10000;
}
function log2(amount) {
  let bit;
  for (bit = 0; !(amount & 0x80000000); bit++) {
    amount <<= 1;
  }
  let s = (amount >> 24) & 0x7f;
  let low = (amount >> 16) & 0xff;
  let v = (logtb[s + 1] * low + logtb[s] * (0x100 - low)) >> 8;
  v = v >> 16;
  v += 24 - bit;
  return v;
}
const test = () => {
  const perfObserver = new PerformanceObserver((items) => {
    items.getEntries().forEach((entry) => {
      console.log(entry);
    });
  });
  perfObserver.observe({ entryTypes: ['measure'] });
  performance.mark('log2-start');
  for (let i = 1; i < 3333; i++) {
    log2(i);
  }
  performance.mark('log2-end');
  performance.measure('read', 'log2-start', 'log2-end');

  performance.mark('log2-start');
  for (let i = 1; i < 3333; i++) {
    Math.log2(i);
  }
  performance.mark('log2-end');
  performance.measure('a', 'log2-start', 'log2-end');

  load('./log2.wasm').then((module) => {
    const logccc = module.exports.logshort2;

    performance.mark('log2-start');
    for (let i = 1; i < 3333; i++) {
      logccc(i);
    }
    performance.mark('log2-end');
    performance.measure('c', 'log2-start', 'log2-end');
  });
};
test();
