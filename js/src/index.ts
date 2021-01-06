import { AnalyzerView } from "./analyserView.js";
import { startBtn, stdoutPanel, cdiv } from "./misc-ui.js";
import { ttt } from "./stats.js";
import { ParamController } from "./param-controller.js";

const slid = new ParamController(
  "root",
  (val: string) => {
    stdout("slid change val " + val);
  },
  {}
);
const { printrx, printlink, stdout } = stdoutPanel(document.querySelector("#root"));
let ctx: AudioContext;
let proc: AudioWorkletNode;
let worker = new Worker("js/build/ws-worker.js", {
  type: "module",
});
worker.onmessage = ({ data }) => {
  //  requestAnimationFrame(() => printrx(JSON.stringify(data.stats)));
  requestAnimationFrame(() => {
    if (data.msg) {
      stdout(data.msg);
    } else if (data.stats) {
      onStats(data);
    } else if (data.playback) {
      menu.classList.add("playing");
      const { bpm, name, seconds, text } = data.playback;

      if (bpm) {
        printrx("BPM: " + Math.floor(data.playback.bpm));
        //  bpmview.innerHTML = Math.floor(data.bpm) + "bpm";
      }
      onPlayback(data);
      if (data.playback.meta) {
        debugger;
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
const playPauseBtn = document.querySelector<HTMLButtonElement>("button#btn"); //#playpause");
let paused = true;
let init = false;

function handleBtnClick(e: MouseEvent, url: string) {
  e.preventDefault();
  let caller: HTMLButtonElement = e.target as HTMLButtonElement;
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
}
const menu = document.querySelector("#menu");
playPauseBtn.onclick = (e) => handleBtnClick(e, "/pcm/" + nowplaying);
const { onStats, onPlayback } = ttt();

const html_play = " play ";
const html_pause = "pause";

fetch("/midi?format=json")
  .then((res) => res.json())
  .then((json) => {
    const div = cdiv("div");

    json.map((name: string, s: any) => {
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
