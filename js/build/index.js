import { AnalyzerView } from "./analyserView.js";
import { stdoutPanel, cdiv } from "./misc-ui.js";
import { ttt } from "./stats.js";
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
            // document.querySelector("ul").style.display = "block";
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
const pause = () => worker.postMessage({ cmd: "pause" });
const playPauseBtn = document.querySelector("button#btn"); //#playpause");
let paused = true;
let init = false;
function handleBtnClick(e, url) {
    e.preventDefault();
    if (!init) {
        stdout("[User]: Clicked Start");
        start().then(() => {
            debugger;
            worker.postMessage({
                url,
            });
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
}
playPauseBtn.onclick = handleBtnClick;
const { onStats, onPlayback } = ttt();
worker.onmessage = ({ data }) => {
    //  requestAnimationFrame(() => printrx(JSON.stringify(data.stats)));
    requestAnimationFrame(() => {
        if (data.msg) {
        }
        else if (data.stats) {
            onStats(data);
        }
        else if (data.playback) {
            const { bpm, name, seconds, text } = data.playback;
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
const html_play = " play ";
const html_pause = "pause";
fetch("/midi?format=json")
    .then((res) => res.json())
    .then((json) => {
    const div = cdiv("div");
    json.map((name, s) => {
        const btn = document.createElement("button");
        btn.innerHTML = name;
        btn.dataset.url = "/pcm/" + encodeURI(name);
        btn.addEventListener("click", (e) => handleBtnClick(e, "/pcm/" + encodeURI(name))); // = handleBtnClick();
        const li = document.createElement("li");
        li.innerHTML = name;
        li.append(btn);
        div.append(li); //document.createElement("li"));
    });
    document.body.append(div);
})
    .catch((e) => {
    alert(e.message);
});
