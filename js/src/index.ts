import { AnalyzerView } from "./analyserView.js";
import { startBtn, stdoutPanel, cdiv } from "./misc-ui.js";
import { ttt } from "./stats.js";
import { EventsPanel } from "panel";
import { UISlider, slider } from "./playback-slider.js";
const { printrx, printlink, stdout } = stdoutPanel(document.querySelector("#root"));
let ctx: AudioContext;
let proc: AudioWorkletNode;
let commsworker = new Worker("/js/build/ws-worker.js", {
  type: "module",
});
let worker = new Worker("/js/build/fetchworker.js", {
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

const panel: HTMLDivElement = document.createElement("div")!;
document.body.append(panel);
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
    worker: commsworker,
    cmd: "config",
    label: "knee",

    attribute: "knee",
    min: 40,
    max: 90,
    step: 1,
    defaultValue: 44,
  }),
  UISlider({
    worker: commsworker,
    label: "ratio",
    cmd: "config",
    attribute: "ratio",
    min: 0,
    defaultValue: 5,
    max: 26,
  }),
  UISlider({
    worker: commsworker,

    cmd: "config",
    label: "threshold",

    attribute: "threshold",
    min: 12,
    max: 90,
    step: 1,
    defaultValue: -45,
  }),
];

const start = async function (url: string = "/pcm/song.mid") {
  ctx = new AudioContext({ sampleRate: 48000, latencyHint: "playback" });
  if (proc) proc.disconnect();
  if (!proc) {
    try {
      await ctx.audioWorklet.addModule("/js/build/proc2.js");
      proc = new AudioWorkletNode(ctx, "playback-processor", {
        outputChannelCount: [2],
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
  if (proc && proc.numberOfOutputs > 0) {
    proc.disconnect();
    proc = null;
  }
  proc = new AudioWorkletNode(ctx, "playback-processor", {
    outputChannelCount: [2],
  });
  proc.connect(gainNode);
  proc.connect(ctx.destination);
  worker.postMessage({ port: proc.port, url }, [proc.port]);
};
const pause = () => commsworker.postMessage({ cmd: "pause" });
const playPauseBtn = document.querySelector<HTMLButtonElement>("button#btn");
playPauseBtn.setAttribute("href", "/pcm/song.mid"); //#playpause");
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

  if (!nowPlaying.url) {
    nowPlaying = { url, div: caller };
    caller.innerHTML = html_pause;
    paused = false;
    playUrl(url);
    playPauseBtn.querySelector("use").setAttribute("href", "#pause");
  } else if (nowPlaying.url && nowPlaying.url === url) {
    if (paused) {
      caller.innerHTML = html_pause;
      playUrl(url);
      paused = false;
      playPauseBtn.querySelector("use").setAttribute("href", "#pause");
    } else {
      caller.innerHTML = html_play;

      commsworker.postMessage({ cmd: "pause" });
      paused = true;
      playPauseBtn.querySelector("use").setAttribute("href", "#play");
    }
  } else if (nowPlaying.url !== "" && nowPlaying.url !== url) {
    nowPlaying.div.innerHTML = html_play;
    playUrl(url);

    paused = false;
    nowPlaying.url = url;
    playPauseBtn.querySelector("use").setAttribute("href", "#play");
  } else {
    playUrl(url);
    playPauseBtn.querySelector("use").setAttribute("href", "#pause");
    caller.innerHTML = html_pause;
  }
}

const html_play = " play ";
const html_pause = "pause";
document.querySelector("main").onmousedown = (e) => {
  if (e.target.hasAttribute("href")) {
    handleBtnClick(e, e.target.getAttribute("href"));
  }
};
