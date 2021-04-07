import { initsfbk } from './dist/sfbk.js';
import { Runtime } from './dist/runtime.js';
const midiurls = [
  'https://grep32bit.blob.core.windows.net/midi/Beethoven-Symphony5-1.mid',
];

const selects = document.querySelectorAll('select');
let proc, ctx, worker;

async function initCtx() {
  ctx = new AudioContext({ sampleRate: 48000, latencyHint: 'playback' });
  await ctx.audioWorklet.addModule('dist/rend-proc.js');
  proc = new AudioWorkletNode(ctx, 'wasm-render-proc', {
    outputChannelCount: [2],
  });
  worker.postMessage({ port: proc.port }, [proc.port]);
  proc.connect(ctx.destination);
}
initsfbk('https://dsp.grepawk.com/ssr-bach/GeneralUserGS.sf2').then(
  ({ pdta, workerWait }) => {
    document.body.querySelector('#mocha').appendChild(
      h('div', {}, [
        h('pre', {}, []),
        h(
          'button',
          {
            onclick: (e) => {
              if (!ctx) {
                ctx = new AudioContext();
                const proc;
              }
              e.target.parentElement.children[0].innerHTML = ctx.currentTime;
            },
          },
          'start'
        ),
        h(
          'button',
          {
            onclick: (e) => {
              playnote();
            },
          },q
          'start'
        ),
      ])
    );
    const pre = document.querySelector('pre');

    workerWait.then((worker) => {
      worker.onmessage = ({ data }) => {
        pre.innerHTML += JSON.stringify(data);
      };
      worker.postMessage({
        zone: pdta.findPreset(0, 0, 55, 66).zones[0][0].serialize(),
        note: {
          key: 55,
          velocity: 55,
          start: 0.01,
          duration: 0.5,
          channelId: 0,
        },
      });
    });
  }
);
let ctx;
