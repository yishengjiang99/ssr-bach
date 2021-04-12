import { LFO } from './dist/LFO.js';
let t;
onmessage = (e) => {
  if (e.data == '1') start();
  else clearTimeout(t);
};

function start() {
  const lfo = new LFO(-12000, 0.2, { pitch: 411 }, 48000);
  t = setInterval(() => {
    lfo.shift(128);
    postMessage({ pitch: lfo.pitchCent });
  }, 3.5);
}
