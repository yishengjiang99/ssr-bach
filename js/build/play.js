import { procURL, workerURL } from "./blobURLs.js";
export class FF32Play extends EventTarget {
    constructor() {
        super();
        this.ctx = new AudioContext({
            sampleRate: 48000,
            latencyHint: "playback",
        });
        this.ctx = new AudioContext();
    }
    async load() {
        return this.ctx.audioWorklet.addModule(procURL).then(() => {
            this.worklet = new AudioWorkletNode(this.ctx, "playback-processor", {
                outputChannelCount: [2],
            });
            this.worklet.connect(this.ctx.destination);
            this.worker = new Worker(workerURL);
            this.worker.postMessage({ port: this.worklet.port }, [this.worklet.port]);
            this.worker.onmessage = (e) => {
                this.dispatchEvent(new CustomEvent("progress", { detail: e.data }));
            };
            this.dispatchEvent(new CustomEvent("loaded"));
        });
    }
    async queue(url) {
        this.worker.postMessage({ url });
    }
    next() {
        this.worker.postMessage({ cmd: "ff" });
    }
}
