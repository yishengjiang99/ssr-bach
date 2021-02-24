const selector = document.querySelector("select");
const worker = new Worker("/js/build/fetchworker.js", {
    type: "module",
});
let proc, ctx;
try {
    ctx = new AudioContext();
}
catch (e) {
}
export async function start(midifile) {
    try {
        ctx = ctx || new AudioContext();
        if (ctx.state != 'running')
            await ctx.resume();
        await ctx.audioWorklet.addModule("js/build/proc3.js");
        proc = new AudioWorkletNode(ctx, "playback-processor", {
            outputChannelCount: [2],
        });
        proc.connect(ctx.destination);
        worker.postMessage({ port: proc.port, url: "/pcm/" + midifile }, [proc.port]);
    }
    catch (e) {
        console.log("<font color='red'>" + e.message + "</font>");
    }
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
