import { AnalyzerView } from "./analyserView.js";
import { startBtn, stdoutPanel, cdiv } from "./misc-ui.js";
import { ttt } from "./stats.js";
let ctx: AudioContext;
let proc: AudioWorkletNode;
let worker = new Worker("js/build/ws-worker.js", {
  type: "module",
});
globalThis.worker = worker;
const { printrx, printlink, stdout } = stdoutPanel(
  document.querySelector("#root")
);
stdout("loaded");

let gainNode, av, canvas;
const start = async function (url: string = "/pcm/song.mid") {
  ctx = new AudioContext({ sampleRate: 48000, latencyHint: "playback" });
  if (!proc) {
    try {
      await ctx.audioWorklet.addModule("./js/build/proc2.js");
      proc = new AudioWorkletNode(ctx, "playback-processor", {
        outputChannelCount: [2],
      });
      await new Promise<void>((resolve) => {
        proc.port.onmessage = ({ data }) => {
          resolve();
        };
      });
      // document.querySelector("ul").style.display = "block";
      worker.postMessage({ port: proc.port }, [proc.port]);
      gainNode = new GainNode(ctx);
      av = new AnalyserNode(ctx);
      gainNode.connect(av).connect(ctx.destination);
      const avcanvas = AnalyzerView(av);
      setTimeout(avcanvas.start, 1000);

      proc.connect(gainNode);
      return { gainNode, ctx };
    } catch (e) {
      alert(e.message);
    }
  }
  if (url) {
    worker.postMessage({ url });
  }
};
const play = (file: string = "") => worker.postMessage({ cmd: "play " + file }); ///pcm" + file });
const FF = () => worker.postMessage({ cmd: "FF" });
const pause = () => worker.postMessage({ cmd: "pause" });
const playPauseBtn = document.querySelector<HTMLButtonElement>("button#btn"); //#playpause");
let paused = true;
let init = false;
playPauseBtn.onclick = (e) => {
  e.preventDefault();
  if (!init) {
    stdout("[User]: Clicked Start");
    start().then(() => {
      worker.postMessage({ url: "/pcm/song.mid" });
    });
    init = true;
    playPauseBtn.querySelector("use").setAttribute("href", "#pause");
  } else if (init && !paused) {
    pause();
    playPauseBtn.querySelector("use").setAttribute("href", "#play");
  } else {
    worker.postMessage({ cmd: "resume" });
    playPauseBtn.querySelector("use").setAttribute("href", "#pause");
  }
  paused = !paused;
  playPauseBtn
    .querySelector("use")
    .setAttribute("href", paused ? "#play" : "#pause");
};
const { onStats, onPlayback } = ttt();
worker.onmessage = ({ data }) => {
  //  requestAnimationFrame(() => printrx(JSON.stringify(data.stats)));
  requestAnimationFrame(() => {
    if (data.msg) {
    } else if (data.stats) {
      onStats(data);
    } else if (data.playback) {
      onPlayback(data);
    }
  });
};
window.onhashchange = () => {
  start().then(() => {
    worker.postMessage({ url: window.location.hash.substring(1) });
  });
};

const html_play = " play ";
const html_pause = "pause";
function playPauseBtn2(url) {
  const btn: HTMLButtonElement = document.createElement("button"); //#playpause");
  btn.innerHTML = html_play;
  let state = 0;
  btn.onclick = (e) => {
    e.preventDefault();
    switch (state) {
      case 0: //not playing
        if (!proc) {
          //this is a global state, first song played in sesion.
          //need to init processor
          stdout("[User]: Clicked Start");
          start().then(() => {
            worker.postMessage({ url: url });
          });
        } else {
          worker.postMessage({ url: url });
        }
        state = 1;
        btn.innerHTML = html_play;
        break;
      case 1: //playing
        worker.postMessage({ cmd: "pause" });
        btn.innerHTML = html_pause;
        gainNode.gain.linearRampToValueAtTime(0.001, 0.2);
        state = 2;
        break;
      case 2: //playing
        worker.postMessage({ cmd: "resume" });
        gainNode.gain.exponentialRampToValueAtTime(1, 0.1);
        state = 1;
        btn.innerHTML = html_play;

        break;
    }
  };
  return btn;
}
debugger;
fetch("/midi?format=json")
  .then((res) => res.json())
  .then((json) => {
    debugger;
    const div = cdiv("div");
    json.map((name, s) => {
      div.append(
        cdiv("li", { innerHTML: name }, [
          cdiv("span", {}, [name]),
          playPauseBtn2("/pcm/" + name),
        ])
      );
    });
    document.body.append(div);
  })
  .catch((e) => {
    alert(e.message);
  });
