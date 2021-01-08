import { AnalyzerView } from "./analyserView.js";
import { startBtn, stdoutPanel, cdiv } from "./misc-ui.js";
import { ttt } from "./stats.js";
import { playbackSlider, loadProc } from "./playback-slider.js";
const { printrx, printlink, stdout } = stdoutPanel(document.querySelector("#root"));
let ctx: AudioContext;
let proc: AudioWorkletNode;
let worker = new Worker("js/build/ws-worker.js", {
  type: "module",
});

const menu = document.querySelector("#menu");
const panel: HTMLDivElement = document.querySelector("#panel");
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
      if (info.seconds) slider.value = "" + Math.floor(info.seconds);
      if (info.bpm) printrx(slider.value);
      if (info.mea) {
      }
      //not sure
    }
  });
};

globalThis.worker = worker;

stdout("loaded");
let nowPlaying = {
  div: null,
  url: "",
};

let gainNode: AudioNode, av: AnalyserNode, canvas: any;
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
const playUrl = (url) => {
  worker.postMessage({ cmd: "play", url: url });
};
const pause = () => worker.postMessage({ cmd: "pause" });
const playPauseBtn = document.querySelector<HTMLButtonElement>("button#btn"); //#playpause");
let paused = true;
let init = false;

async function handleBtnClick(e: MouseEvent, url: string) {
  e.preventDefault();
  let caller: HTMLButtonElement = e.target as HTMLButtonElement;

  if (!init) {
    stdout("[User]: Clicked Start");
    await start();

    init = true;
  }

  if (nowPlaying.url === "") {
    nowPlaying = { url, div: caller };
    caller.innerHTML = html_pause;
    paused = false;
    playUrl(url);
  } else if (nowPlaying !== null && nowPlaying.url === url) {
    if (paused) {
      caller.innerHTML = html_pause;

      worker.postMessage({ cmd: "resume" });
      paused = false;
      eventPanel.stop();
      pause();
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
window.onhashchange = (e) => {
  stdout(document.location.hash.substr(1));
  handleBtnClick(e, "/" + document.location.hash.substr(1));
};
fetch("/midi?format=json")
  .then((res) => res.json())
  .then(function gen(resultjson) {
    menu.innerHTML = resultjson
      .map((name: string, s: any) => `<li>${name}<a href='#${name}'>Play</a></li>`)
      .join("");

    return menu;
  })

  .catch((e) => {
    alert(e.message);
  });
