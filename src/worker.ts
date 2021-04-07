import { Runtime } from './runtime.js';
import { initSDTA } from './sdta.js';
let renderFn;
let ctx;
/*
    blockLength: any,
    { iterator, start, end, startLoop, endLoop }: any,
    { pitch, volume, pan }: any
    */
onmessage = ({ data: { cmd, sdta, zone, note } }) => {
  if (cmd) {
    switch (cmd) {
      case 'start':
        ctx = new AudioContext({
          latencyHint: 1,
          sampleRate: 44100,
        });
        setTimeout(() => {
          _postMsg({ time: ctx.currentTime });
        }, 55);
        break;
    }
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
      .then((ab) => initSDTA(new Uint8Array(ab)))
      .then(({ render }) => {
        renderFn = render;
        _postMsg({ init: 1 });
      })
      .catch((e) => {
        _postMsg({ init: -1, error: e });
      });
  }
  if (zone && note && renderFn) {
    const rt = new Runtime(zone, { key: note.midi, velocity: note.velocity });
    const { pitch, volume } = rt.run(128);
    const ob = renderFn(
      128,
      {
        iterator: 0,
        ...rt.sample,
      },
      { pitch, volume, pan: rt.staticLevels.pan }
    );
    _postMsg({ ob });
  }
};
function _postMsg(obj) {
  //@ts-ignore
  postMessage(obj);
}
