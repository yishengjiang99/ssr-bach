// /* eslint-disable @typescript-eslint/ban-ts-comment */
// import { RingBuffer } from 'nodep/dist/rb.js';
// import { ringbuf } from './gheap.js';
// import { Runtime } from './runtime.js';
// import { initSDTA } from './sdta.js';
// import { SharedRingBuff } from './srb.js';

// const sampleRate = 48000;
// const voices = new Array(16);
// let samples, _port;
// const _sab = new Uint8Array(
//   new WebAssembly.Memory({
//     maximum: 10,
//     initial: 10,
//     //@ts-ignore
//     shared: true,
//   }).buffer
// );
// const sRingBuf = new SharedRingBuff(_sab);

// onmessage = (e) => {
//   //
//   const {
//     data: { sdta, zone, note, port },
//   } = e;
//   console.debug(e.data);

//   if (sdta) {
//     const {
//       url,
//       range: [start, end],
//     } = sdta;
//     fetch(url, {
//       mode: 'no-cors',
//       headers: {
//         Range: 'bytes=' + (start - 8) + '-' + end,
//       },
//     })
//       .then((res) => res.arrayBuffer())
//       .then(async (ab) => {
//         samples = new Int16Array(ab);
//         _postMsg({
//           init: 1,
//         });
//       })
//       .catch((e) => {
//         console.log(e);
//         _postMsg({ init: -1, error: e });
//         throw e;
//       });
//   }
//   if (port) {
//     _port = port;
//     _port.postMessage({ sab: _sab });
//   }

//   if (zone && note) {
//     const rt = new Runtime(zone, { key: note.midi, velocity: note.velocity });
//     rt.mods.ampVol.triggerRelease(note.duration * sampleRate);
//   }
// };

// function _postMsg(obj, sharing = null) {
//   if (sharing !== null) {
//     postMessage(obj, sharing);
//   } else {
//     //@ts-ignore
//     postMessage(obj);
//   }
// }
