import { AnalyzerView } from "./analyserView.js";
import { startBtn, stdoutPanel, cdiv } from "./misc-ui.js";
import { ttt } from "./stats.js";
import { UISlider, slider } from "./playback-slider.js";
const { printrx, printlink, stdout } = stdoutPanel(document.querySelector("#root"));
let ctx: AudioContext;
let proc: AudioWorkletNode;
let worker = new Worker("js/build/ws-worker.js", {
  type: "module",
});
let playbackSlider = UISlider({
  worker,
  label: "playback",
  defaultValue: 0,
  min: 0,
  max: 600,
  cmd: "seek",
  attribute: "time",
});

let gainNode: AudioNode, av: AnalyserNode, canvas: any;
const menu = document.querySelector("#menu");
const panel: HTMLDivElement = document.querySelector("#panel");
worker.onmessage = ({ data }) => {
  //  requestAnimationFrame(() => printrx(JSON.stringify(data.stats)));
  requestAnimationFrame(() => {
    if (data.msg) {
      stdout(data.msg);
    } else if (data.stats) {
      onStats(data);
    } else if (data.playback && data.playback.info) {
      const { event, info } = data.playback;
      if (info.seconds) playbackSlider.value = "" + Math.floor(info.seconds);
      if (info.bpm) printrx(info.bpm);
      if (info.meta) {
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
let controls = [
  UISlider({
    worker,
    defaultValue: 1,
    cmd: "config",
    label: "preamp",

    attribute: "preamp",
    min: -0.1,
    max: 2,
  }),
  UISlider({
    worker,
    cmd: "config",
    label: "threshold",

    attribute: "threshold",
    min: -50,
    max: -40,
    step: 1,
    defaultValue: -45,
  }),
  UISlider({
    worker,
    label: "ratio",
    cmd: "config",
    attribute: "ratio",
    min: 0,
    max: 2,
  }),
];

const start = async function (url: string = "/pcm/song.mid") {
  ctx = new AudioContext({ sampleRate: 48000, latencyHint: "playback" });
  if (proc) proc.disconnect();
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
      stdout("<font color='red'>" + e.message + "</font>");
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
const { onStats, onPlayback } = ttt();
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
    //caller.innerHTML = html_pause;
    paused = false;
    playUrl(url);
  } else if (nowPlaying !== null && nowPlaying.url === url) {
    if (paused) {
      caller.innerHTML = html_pause;

      worker.postMessage({ cmd: "resume" });
      paused = false;

      pause();
    } else {
      caller.innerHTML = html_play;
      worker.postMessage({ cmd: "pause" });
      paused = true;
    }
  } else if (nowPlaying.url !== "" && nowPlaying.url !== url) {
    //   nowPlaying.div.innerHTML = html_play;
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
const wschan = new BroadcastChannel("wschan");
wschan.onmessage = ({ data }) => {
  // stdout(JSON.stringify(data));
};
playPauseBtn.onclick = (e) => handleBtnClick(e, "/pcm/" + nowPlaying.url);

const html_play = " play ";
const html_pause = "pause";
window.onhashchange = () => {
  stdout(document.location.hash.substr(1));
  start().then(() => {
    worker.postMessage({ url: "/pcm/" + document.location.hash.substr(1) });
  });
  nowPlaying = {
    url: "/pcm/" + document.location.hash.substr(1),
    div: null,
  };
};
