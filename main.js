import { h, mlist, pdtaView } from './dist/react-light.js';
import { initsfbk } from './dist/sfbk.js';
document.querySelector('main').appendChild(mlist);

const workletcode = URL.createObjectURL(
  new Blob([document.getElementById('workletcode').textContent], {
    type: 'text/javascript',
  })
);
export const ch = new MessageChannel();
const cosole = document.querySelector('pre');
cosole.innerHTML+="\nloading"
const sfurls = ['GeneralUserGS.sf2'];
let _sdtaWait, timer, _pdta, proc, ctx;
let playing = false;
queueMicrotask(init);

async function init() {
  const { pdta, sdtaWait } = await initsfbk(sfurls[0], ch.port2);
  ctx = new AudioContext();
  await ctx.audioWorklet.addModule(workletcode);
  proc = new AudioWorkletNode(ctx, 'rend-proc', {
               outputChannelCount: [2],
             });

  _pdta = pdta;
  _sdtaWait = sdtaWait;
  await ctx.resume();
  proc.connect(ctx.destination);

}




const [playBtn, stopbtn] = document.querySelectorAll('button');

playBtn.addEventListener('click', () => {
  if (!ctx) {
    await initCtx();
  }
  playing = true;
  timer = playMidi(durationTicks, header, tracks);
  e.target.setAttribute('disabled', 'true');
  stopBtn.setAttribute('disabled', 'false');
});
stopbtn.addEventListener('click', () => {
  playing = false;
  e.target.setAttribute('disabled', 'true');
  playBtn.setAttribute('disabled', 'false');
});

async function playMidi(url) {
  const { durationTicks, header, tracks } = await Midi.fromUrl(url);
  let t = -200;
  while (t < durationTicks && playing) {
    let output = '';
    const _t = header.secondsToTicks(t / 1000);
    const ratio = t / _t;
    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i];
      while (
        track.notes &&
        track.notes[0] &&
        track.notes[0].ticks < _t + 230
      ) {
        const note = track.notes.shift();
        const pset = _pdta.findPreset(
          track.instrument.number,
          track.instrument.percussion ? 128 : 0,
          note.midi,
          note.velocity * 127
        );
        const z = pset.zones;

        if (z[0] && z[0][0]) {
          proc.port.postMessage({
            zone: z[0][0].serialize(),
            note: {
              midi: note.midi,
              velocity: note.velocity * 127,
              start: note.time,
              durationTime: note.durationTime,
              channelId: channelId,
            },
          });
        }
      }
      t += 200;
      await new Promise((r) => setTimeout(r, 500));
      if (output) pre.innerHTML = output;
    }
  }
}