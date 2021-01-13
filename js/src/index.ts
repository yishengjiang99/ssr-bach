import { AnalyzerView } from "./analyserView.js";
import { startBtn, stdoutPanel, cdiv } from "./misc-ui.js";
import { EventsPanel } from "./panel.js";
import { ttt } from "./stats.js";
const { printrx, printlink, stdout } = stdoutPanel(document.querySelector("#root"));
let ctx: AudioContext;
let proc: AudioWorkletNode;
let commsworker = new Worker("/js/build/ws-worker.js", {
  type: "module",
});
let worker = new Worker("/js/build/fetchworker.js", {
  type: "module",
});
let timelogger;
function logtime() {
  let t0 = performance.now();
  return function log(str: string) {
    stdout(`${performance.now() - t0}: ${str}`);

    //t0 = performance.now();
    return true;
  };
}
let gainNode: AudioNode, av: AnalyserNode, canvas: any;

const selector = document.querySelector("select");
const button = document.querySelector("button");

button.onclick = (e) => start(selector.value);
selector.onchange = (e) => {
  start(selector.value);
};

const { onStats } = ttt();
worker.onmessage = ({ data }) => {
  //  requestAnimationFrame(() => printrx(JSON.stringify(data.stats)));
  requestAnimationFrame(() => {
    if (data.msg) {
      if (timelogger) timelogger(data.msg); //(data.msg);
    } else if (data.stats) {
      printrx(JSON.stringify(data.stas), 2);
      onStats(data);
    } else if (data.playback && data.playback.info) {
      const { event, info } = data.playback;
      if (info.seconds) {
        printrx("Playback: " + info.seconds, 0);
      }
      if (info.bpm) printrx(info.bpm);
      if (info.meta) {
      }
      //not sure
    }
  });
};
const start = async function (midifile) {
  timelogger = logtime();
  timelogger("user init - clicked");
  if (!ctx) {
    ctx = new AudioContext({ sampleRate: 48000, latencyHint: "playback" });
    await ctx.audioWorklet.addModule("/js/build/proc2.js");
  }
  if (proc) {
    proc.disconnect();
    proc = null;
  }
  try {
    proc = new AudioWorkletNode(ctx, "playback-processor", {
      outputChannelCount: [2],
    });
    timelogger(" client  load");
    worker.postMessage({ port: proc.port, url: "/pcm/" + midifile }, [proc.port]);
    gainNode = new GainNode(ctx);
    av = new AnalyserNode(ctx);
    gainNode.connect(av).connect(ctx.destination);
    const avcanvas = AnalyzerView(av);

    setTimeout(() => {
      panel.start("/rt/" + midifile);
      avcanvas.start();
    }, 1000);
    proc.connect(gainNode);
  } catch (e) {
    stdout("<font color='red'>" + e.message + "</font>");
  }
};
const panel = new EventsPanel();

// var canvas = document.createElement("canvas");
//     document.body.append(canvas);
//     function resizeCanvas() {
//       canvas.style.width = window.innerWidth + "px";
//       canvas.style.height = window.innerHeight + "px";
//       const WIDTH = window.innerWidth; //.clientHeight;
//       const HEIGHT = window.innerHeight;
//       canvas.setAttribute("width", WIDTH + "");
//       canvas.setAttribute("height", HEIGHT + "");
//     }

//     // Webkit/Blink will fire this on load, but Gecko doesn't.
//     window.onresize = resizeCanvas;
//     resizeCanvas();
//     this.canvas = canvas;
//   }
//   stop() {
//     this.evt.close();
//   }
//   start(rtlink: string) {
//     const canvasCtx: CanvasRenderingContext2D = this.canvas.getContext("2d")!;
//     const WIDTH = window.innerWidth; //.clientHeight;
//     const HEIGHT = window.innerHeight;
//     canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
//     canvasCtx.fillStyle = `rbga(${pallet[0]},1)`;
//     canvasCtx.lineWidth = 1;
//     canvasCtx.strokeStyle = "white";

//     const svt: EventSource = new EventSource(rtlink);
//     let t0;
//     this.evt = svt;
//     svt.onopen = () => {
//       t0 = performance.now();
//       requestAnimationFrame(draw);

//       // @ts-ignore
//       svt.addEventListener("note", ({ start, duration, trackId, midi, instrument }) => {
//         this.bars.push({ start, duration, trackId, midi, instrument });
//       });
//     };
//     svt.addEventListener(
//       "closed",
//       () => {
//         this.ended = true;
//       },
//       { once: true }
//     );

//     const secondToPixelX = (t) => {
//       return WIDTH / 2 - ((t - this.offset) * WIDTH) / this.lookbackWindow;
//     };

//     const draw = () => {
//       const elapsed = performance.now() - t0;
//       this.offset += elapsed;

//       if (this.bars.length === 0) return;
//       let tn = this.bars[0].start;
//       while (true) {
//         const { start, duration } = this.bars[this.bars.length - 1];
//         if (start + duration > this.offset - this.lookbackWindow) {
//           this.bars.shift();
//         } else {
//           break;
//         }
//       }
//       canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
//       for (const bar of this.bars) {
//         canvasCtx.fillStyle = `rbga(${pallet[bar.trackId]},1)`;
//         canvasCtx.moveTo((HEIGHT / 88) * bar.midi, secondToPixelX(bar.start));
//         canvasCtx.fillRect(0, 0, HEIGHT / 88, secondToPixelX(bar.duration));
//       }
//       canvasCtx.save();
//       canvasCtx.restore();
//       requestAnimationFrame(draw);
//     };
//   }
// }
