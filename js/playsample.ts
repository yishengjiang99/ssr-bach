import { AnalyzerView } from "./analyzerview.js";
import { FF32Play } from "./node_modules/ff32bit/dist/index.js";
let ctx: AudioContext, gainNode: GainNode, av: AnalyserNode;

window.onload = () => {
  document.querySelectorAll("a").forEach(
    (a) =>
      (a.onclick = async (e) => {
        e.preventDefault();
        let player = new FF32Play();
        player.load().then(() => {
          const worklet = player.worklet;
          const ctx = worklet.context;
          av = new AnalyserNode(worklet.context);
          document.body.className = "playing";
          worklet.disconnect();
          worklet
            .connect(
              new DynamicsCompressorNode(ctx, {
                threshold: -76,
                ratio: 4,
                knee: 24,
                attack: 0.5,
              })
            )
            .connect(av);
          const { canvas, start } = AnalyzerView(av);
          document.body.append(canvas);
          av.connect(ctx.destination);
          start();
          player.queue(a.href);
          player.addEventListener("progress", console.log);
        });
      })
  );
};
// document.querySelectorAll("a").forEach(
//   (a) =>
//     (a.onclick = async (e) => {
//       const url = a.href;
//       e.preventDefault();
//       if (!ctx) init();

//       const dv = await fetch(url)
//         .then((resp) => resp.blob())
//         .then((blob) => blob.arrayBuffer())
//         .then((ab) => new DataView(ab))
//         .catch(console.log);

//       if (!dv) return;
//       const audb = ctx.createBuffer(1, dv.buffer.byteLength / 4, 48000);
//       const buffer = audb.getChannelData(0);
//       for (let i = 0; i < audb.length; i++) {
//         buffer[i] = dv.getFloat32(i * 4, true);
//       }
//       const abs = new AudioBufferSourceNode(ctx, { buffer: audb });
//       abs.connect(gainNode);
//       abs.start();
//     })
// );

// const init = () => {
//   ctx = new AudioContext();
//   gainNode = new GainNode(ctx);
//   av = new AnalyserNode(ctx);

//   gainNode.connect(av).connect(ctx.destination);
//   const { canvas, start } = AnalyzerView(av);
//   document.body.append(canvas);
//   start();
//   return { gainNode, ctx };
// };
