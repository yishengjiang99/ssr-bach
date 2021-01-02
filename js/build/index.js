import { AnalyzerView } from "./analyserView.js";
import { stdoutPanel } from "./misc-ui.js";
let ctx;
let proc;
let worker = new Worker("js/build/ws-worker.js", {
    type: "module",
});
globalThis.worker = worker;
const { printrx, printlink, stdout } = stdoutPanel(document.querySelector("#root"));
stdout("loaded");
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
            document.querySelector("ul").style.display = "block";
            worker.postMessage({ port: proc.port }, [proc.port]);
            gainNode = new GainNode(ctx);
            av = new AnalyserNode(ctx);
            gainNode.connect(av).connect(ctx.destination);
            const avcanvas = AnalyzerView(av);
            setTimeout(avcanvas.start, 1000);
            proc.connect(gainNode);
            return { gainNode, ctx };
        }
        catch (e) {
            alert(e.message);
        }
    }
    if (url) {
        worker.postMessage({ url });
    }
};
const play = (file = "") => worker.postMessage({ cmd: "play " + file }); ///pcm" + file });
const FF = () => worker.postMessage({ cmd: "FF" });
const pause = () => worker.postMessage({ cmd: "pause" });
const playPauseBtn = document.querySelector("button#btn"); //#playpause");
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
    }
    else if (init && !paused) {
        pause();
        playPauseBtn.querySelector("use").setAttribute("href", "#play");
    }
    else {
        worker.postMessage({ cmd: "resume" });
        playPauseBtn.querySelector("use").setAttribute("href", "#pause");
    }
    paused = !paused;
    playPauseBtn
        .querySelector("use")
        .setAttribute("href", paused ? "#play" : "#pause");
};
const buffM = document.querySelector("progress#buffered");
buffM.value = 0;
const playedM = document.querySelector("progress#played");
playedM.value = 0;
const loss = document.querySelector("meter#loss");
const inmem = document.querySelector("meter#inmemory");
if (window.BroadcastChannel) {
    globalThis.rfc = new BroadcastChannel("rfc");
    globalThis.rfc.onmessage = ({ data }) => {
        worker.postMessage(data);
    };
}
worker.onmessage = ({ data }) => {
    //  requestAnimationFrame(() => printrx(JSON.stringify(data.stats)));
    requestAnimationFrame(() => {
        if (data.msg) {
        }
        else if (data.stats) {
            buffM.value = data.stats.downloaded;
            playedM.value = data.stats.downloaded - data.stats.buffered;
            loss.value = data.stats.lossPercent;
            inmem.value = data.stats.buffered;
        }
        else if (data.playback) {
            const { bpm, name, seconds, text } = data.playback;
            if (seconds) {
                buffM.setAttribute("max", `` + ((seconds * 48000 * 2 * 4) / 1024).toFixed(2));
                playedM.setAttribute("max", `` + ((seconds * 48000 * 2 * 4) / 1024).toFixed(2));
            }
            if (bpm) {
                printrx("BPM: " + Math.floor(data.playback.bpm));
                //  bpmview.innerHTML = Math.floor(data.bpm) + "bpm";
            }
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
