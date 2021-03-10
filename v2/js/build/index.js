const worker = new Worker("./fetchworker.js");
let proc, ctx;
try {
    ctx = new AudioContext();
}
catch (e) { }
export async function start(midifile) {
    try {
        ctx = ctx || new AudioContext();
        if (ctx.state != "running")
            await ctx.resume();
        await ctx.audioWorklet.addModule("./proc3.js");
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
const btns = document.querySelectorAll("a.pcm");
btns.forEach((a) => {
    a.addEventListener("click", (e) => {
        e.preventDefault();
        start(a.href);
    });
});
