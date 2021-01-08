import { AnalyzerView } from "./analyserView.js";
import { stdoutPanel, cdiv } from "./misc-ui.js";
import { ttt } from "./stats.js";
import { playbackSlider } from "./playback-slider.js";
const { printrx, printlink, stdout } = stdoutPanel(document.querySelector("#root"));
let ctx;
let proc;
let worker = new Worker("js/build/ws-worker.js", {
  type: "module",
});
const menu = document.querySelector("#menu");
const panel = document.querySelector("#panel");
let slider;
worker.onmessage = ({ data }) => {
  //  requestAnimationFrame(() => printrx(JSON.stringify(data.stats)));
  requestAnimationFrame(() => {
    if (data.msg) {
      stdout(data.msg);
    } else if (data.stats) {
      onStats(data);
    } else if (data.playback) {
      const { event, info } = data.playback;
      switch (event) {
        case "#tempo":
          printrx(info.tempo);
          break;
        case "#time":
          slider.value = "" + Math.floor(info.seconds);
          break;
        case "#meta":
          stdout(JSON.stringify(info));
          break;
        default:
          console.log(info, event);
          break;
      }
    }
  });
};
window.onhashchange = () => {
  start().then(() => {
    worker.postMessage({ url: window.location.hash.substring(1) });
  });
};
globalThis.worker = worker;
stdout("loaded");
let nowPlaying = {
  div: null,
  url: "",
};
let gainNode, av, canvas;
const start = async function (url = "/pcm/song.mid") {
  ctx = new AudioContext({ sampleRate: 48000, latencyHint: "playback" });
  if (!proc) {
    try {
      await ctx.audioWorklet.addModule("./js/build/proc2.js");
      proc = new AudioWorkletNode(ctx, "playback-processor", {
        outputChannelCount: [2],
      });
      await new Promise((resolve) => {
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
      slider = playbackSlider({ worker, ctx });
      return { gainNode, ctx };
    } catch (e) {
      alert(e.message);
    }
  }
  if (url) {
    worker.postMessage({ url });
  }
};
const pause = () => worker.postMessage({ cmd: "pause" });
const playPauseBtn = document.querySelector("button#btn"); //#playpause");
let paused = true;
let init = false;
function handleBtnClick(e, url) {
  e.preventDefault();
  let caller = e.target;
  if (!init) {
    stdout("[User]: Clicked Start");
    start().then(() => {
      worker.postMessage({
        url,
      });
    });
    init = true;
    0;
  }
  if (nowPlaying.url === "") {
    worker.postMessage({ url });
    nowPlaying = { url, div: caller };
    caller.innerHTML = html_pause;
    paused = false;
  } else if (nowPlaying !== null && nowPlaying.url === url) {
    if (paused) {
      caller.innerHTML = html_pause;
      worker.postMessage({ cmd: "resume" });
      paused = false;
    } else {
      caller.innerHTML = html_play;
      worker.postMessage({ cmd: "pause" });
      paused = true;
    }
  } else if (nowPlaying.url !== "" && nowPlaying.url !== url) {
    nowPlaying.div.innerHTML = html_play;
    worker.postMessage({ cmd: "stop" });
    worker.postMessage({ url });
    paused = false;
    nowPlaying = { div: caller, url: url };
  } else {
    worker.postMessage({ cmd: "resume" });
    //    playPauseBtn.querySelector("use").setAttribute("href", "#pause");
    caller.innerHTML = html_pause;
  }
  if (!paused) {
    menu.classList.add("collapse");
    panel.classList.add("show");
  } else {
    panel.classList.add("collapse");
    menu.classList.add("show");
  }
}
playPauseBtn.onclick = (e) => handleBtnClick(e, "/pcm/" + nowPlaying.url);
const { onStats, onPlayback } = ttt();
const html_play = " play ";
const html_pause = "pause";
fetch("/midi?format=json")
  .then((res) => res.json())
  .then((json) => {
    const div = cdiv("div");
    json.map((name, s) => {
      const btn = document.createElement("button");
      btn.innerHTML = html_play;
      btn.dataset.url = "/pcm/" + encodeURI(name);
      btn.addEventListener("click", (e) => handleBtnClick(e, "/pcm/" + encodeURI(name))); // = handleBtnClick();
      const li = document.createElement("li");
      li.innerHTML = name;
      li.append(btn);
      div.append(li); //document.createElement("li"));
    });
    menu.append(div);
  })
  .catch((e) => {
    alert(e.message);
  });
