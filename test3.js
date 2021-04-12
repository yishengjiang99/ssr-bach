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
  proc = new AudioWorkletNode(ctx, 'rend-proc', {
    outputChannelCount: [2],
  });
  worker.postMessage({ port: proc.port }, [proc.port]);
  proc.connect(ctx.destination);
}

initsfbk('https://www.grepawk.com/ssr-bach/GeneralUserGS.sf2').then(
  async ({ pdta, sdtaWait }) => {
    await initCtx();

    document.body.querySelector('#mocha').appendChild(
      h('div', {}, [
        h('pre', {}, []),
        h(
          'button',
          {
            onclick: (e) => {
              if (!ctx) {
                ctx = new AudioContext();
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
              playNote();
            },
          },
          'start'
        ),
      ])
    );
    const pre = document.querySelector('pre');

    function playNote() {
      const pset = pdta.findPreset(0, 0, 44, 127);
      pset.zones[0].map((z) => {
        worker.postMessage({
          zone: z.serialize(),
          note: {
            midi: 44,
            velocity: 127,
            start: 0.2,
            durationTime: 0.5,
            channelId: 1,
          },
        });
      });
    }
  }
);
