const chunk = 128 * 4 * 2;
/** @ts-ignore */
/* @ts-ignore */
// @ts-ignore
{
    /* @ts-ignore */
    class PlaybackProcessor
    // @ts-ignore
    /* @ts-ignore */  extends AudioWorkletProcessor {
        constructor() {
            super();
            this.buffers = [];
            this.readqueue = [];
            this.started = false;
            this.abortSignal = false;
            this.threshold = 22;
            this.port.postMessage({ msg: "initialized" });
            this.port.onmessage = ({ data: { reset, readable, url, cmd } }) => {
                that.port.postMessage({ msg: "proc recv first data" });
                if (url || reset) {
                    this.buffers = [];
                    this.started = false;
                    this.readqueue = [];
                    if (this.reading)
                        this.abortSignal = true;
                }
                if (readable) {
                    this.readqueue.push(readable);
                    if (!this.reading)
                        readloop();
                }
            };
            let that = this;
            async function readloop() {
                that.reading = true;
                while (that.readqueue.length > 0) {
                    const next = that.readqueue.shift();
                    if (typeof next === "undefined")
                        break;
                    const reader = await next.getReader();
                    await reader
                        .read()
                        .then(function process(result) {
                        if (result.done)
                            return;
                        let value = result.value;
                        while (value.length >= chunk) {
                            const b = value.slice(0, chunk);
                            that.buffers.push(b);
                            value = value.slice(chunk);
                            that.total++;
                            if (that.started === false && that.buffers.length > that.threshold) {
                                that.started = true;
                                that.port.postMessage({ msg: "starting playback next frame" });
                            }
                        }
                        if (that.abortSignal) {
                            that.abortSignal = false;
                            that.buffers = [];
                            return;
                        }
                        // that.report();
                        reader.read().then(process);
                    })
                        .catch((e) => {
                        that.port.postMessage({ msg: e.message });
                    });
                }
                that.reading = false; //.started = false;
                return;
            }
            this.reading = false;
            this.loss = 0;
            this.total = 0;
        }
        report() {
            this.port.postMessage({
                stats: {
                    running: this.started,
                    downloaded: (this.total * chunk) / 1024,
                    buffered: (this.buffers.length * chunk) / 1024,
                    lossPercent: ((this.loss / this.total) * 100).toFixed(2),
                },
            });
        }
        process(inputs, outputs, parameters) {
            if (this.started === false) {
                return true;
            }
            if (this.buffers.length === 0) {
                this.loss++;
                return true;
            }
            this.total++;
            const ob = this.buffers.shift();
            const dv = new DataView(ob.buffer);
            for (let i = 0; i < 128; i++) {
                outputs[0][0][i] = dv.getFloat32(i * 4 * 2, true);
                outputs[0][1][i] = dv.getFloat32(i * 4 * 2 + 4, true);
            }
            return true;
        }
    }
    // @ts-ignore
    registerProcessor("playback-processor", PlaybackProcessor);
}
