import { printrx, stdout, logtime } from "./misc-ui.js";
import { EventsPanel } from "./panel.js";
import { onStats } from "./stats.js";
import { drawmeta as drawTracks } from "./TrackInfo.js";
import { AnalyzerView } from "./analyserView.js";
const wschan = new BroadcastChannel("wschan");
wschan.onmessage = ({ data: { stats, msg, event, info } }) => {
    if (event === "#time") {
        printrx(info.second, 1);
    }
    else if (event === "#tempo") {
        printrx(info.bpm, 2);
    }
    else if (event === "#meta") {
        drawTracks(info);
    }
    // if (info.seconds) updateMeterMaxrange(info.seconds);
    if (msg) {
        if (logtime)
            logtime(msg);
        else
            stdout(msg);
    }
    if (stats)
        onStats(stats);
};
const wswoker = new Worker("./js/build/ws-worker.js");
const selector = document.querySelector("select");
let ctx, gainNode, av, slider, proc;
export const worker = new Worker("/js/build/fetchworker.js", {
    type: "module",
});
export async function start(midifile) {
    //(async function (midifile: string) {
    const timelogger = logtime(stdout);
    timelogger("user init - clicked");
    const panel = new EventsPanel();
    if (!ctx)
        await initCtx();
    if (proc)
        disconnectExistingProc(proc);
    try {
        proc = new AudioWorkletNode(ctx, "playback-processor", {
            outputChannelCount: [2],
        });
        timelogger(" client  load");
        proc.connect(gainNode);
        worker.postMessage({ port: proc.port, url: "/pcm/" + midifile }, [proc.port]);
        drawCanvasNextTickStart();
        panel.start("/rt/" + midifile);
    }
    catch (e) {
        stdout("<font color='red'>" + e.message + "</font>");
    }
}
async function initCtx() {
    ctx = new AudioContext({ sampleRate: 48000, latencyHint: "playback" });
    await ctx.audioWorklet.addModule("/js/build/proc2.js");
    [gainNode, slider] = initGain(ctx);
    av = new AnalyserNode(ctx);
    gainNode.connect(av).connect(ctx.destination);
    return { ctx, gainNode, slider, av };
}
function drawCanvasNextTickStart() {
    const avcanvas = AnalyzerView(av);
    setTimeout(() => avcanvas.start(), 400);
}
function disconnectExistingProc(proc) {
    if (proc) {
        proc.disconnect();
        proc.port.onmessage = null;
        proc = null;
    }
}
export function initGain(ctx) {
    const gainNode = new GainNode(ctx);
    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = "0";
    slider.max = "2";
    slider.step = "0.1";
    slider.defaultValue = gainNode.gain + "";
    slider.oninput = () => gainNode.gain.linearRampToValueAtTime(parseFloat(slider.value), ctx.currentTime + 0.1);
    return [gainNode, slider];
}
selector.onchange = () => {
    start(selector.value);
};
const buttons = document.querySelectorAll("button");
buttons.forEach((button) => {
    button.addEventListener("click", () => {
        if (!proc || !ctx) {
            start(selector.value);
            return;
        }
        else {
            fetch("/pcm", { method: "POST", body: button.getAttribute("msg") });
        }
    }, { once: true });
});
const links = document.querySelector("a.pointer").addEventListener("click", (e) => {
    e.preventDefault();
    start(e.target.ahref);
});
