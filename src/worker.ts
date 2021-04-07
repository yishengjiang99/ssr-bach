import { Runtime } from './runtime.js';
import { initSDTA } from './sdta.js';
let renderFn;
let sampleRate = 48000;
let rendTimeout;
const voices = new Array(16);
onmessage = ({ data: { cmd, sdta, zone, note } }) => {
  if (cmd) {
  }
  if (sdta) {
    const {
      hostname,
      url,
      range: [start, end],
    } = sdta;
    fetch(url, {
      mode: 'no-cors',
      headers: {
        Range: 'bytes=' + (start - 8) + '-' + end,
      },
    })
      .then((res) => res.arrayBuffer())
      .then(async (ab) => {
        const { render, heap, soundCard } = await initSDTA(new Uint8Array(ab));
        renderFn = render;
        _postMsg({
          init: 1,
          readOffset: soundCard.readOffset,
          heap,
        });
      })
      .catch((e) => {
        console.log(e);
        _postMsg({ init: -1, error: e });
        throw e;
      });
  }
  if (zone && note && renderFn) {
    zone.ampVol;
    const rt = new Runtime(zone, { key: note.midi, velocity: note.velocity });
    rt.mods.ampVol.triggerRelease(note.duration * sampleRate);
    const duration = note.duration + 0.3;
    const { pitch, volume } = rt.run(128);
    const renderIterat = renderFn(rt, note.start, note.channelId);
    voices[note.channelId] = renderIterat;
    if (!rendTimeout)
      rendTimeout = setInterval(() => {
        Object.values(voices).forEach((v) => v.next());
      }, 3.5);
  }
};

function _postMsg(obj, sharing = null) {
  if (sharing !== null) {
    postMessage(obj, sharing);
  } else {
    //@ts-ignore
    postMessage(obj);
  }
}
