import { Runtime } from './runtime.js';
import { initSDTA } from './sdta.js';
let renderFn;
onmessage = ({ data: { sdta, zone, note } }) => {
  if (sdta) {
    const {
      hostname,
      url,
      range: [start, end],
    } = sdta;
    fetch(url, {
      headers: {
        Range: 'bytes=' + (start - 8) + '-' + end,
      },
    })
      .then((res) => res.arrayBuffer())
      .then((ab) => initSDTA(new Uint8Array(ab)))
      .then(({ render }) => {
        renderFn = render;
        _postMsg('initialzied');
      });
  }
};
function _postMsg(obj) {
  //@ts-ignore
  postMessage(obj);
}
