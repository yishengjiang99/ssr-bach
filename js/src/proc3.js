"use strict";
{
    // @ts-ignore
    class PlaybackProcessor extends AudioWorkletProcessor {
        constructor() {
            super();
            this.ended = false;
            this.started = false;
            this.buffers = [];
            const chunk = 128 * 4 * 2;
            this.port.onmessage = async ({ data: { readable }, }) => {
                var that = this;
                const reader = await readable.getReader();
                let leftover;
                reader.read().then(function process(result) {
                    if (result.done)
                        return;
                    let value = result.value;
                    while (value.byteLength >= chunk) {
                        that.buffers.push(value.slice(0, chunk));
                        value = value.slice(chunk);
                        if (!that.started && that.buffers.length > 12) {
                            that.started = true;
                            that.port.postMessage({ ready: 1, dl: that.buffers.length });
                        }
                    }
                    reader.read().then(process);
                });
            };
        }
        process(inputs, outputs, parameters) {
            if (this.started == false || this.buffers.length < 1)
                return true;
            if (this.ended)
                return false;
            const ob = this.buffers.shift();
            const fl = new DataView(ob.buffer);
            for (let i = 0; i < 128; i++) {
                outputs[0][0][i] = fl.getFloat32(8 * i, true);
                outputs[0][1][i] = fl.getFloat32(8 * i + 4, true);
            }
            return true;
        }
    }
    // @ts-ignore
    registerProcessor('playback-processor', PlaybackProcessor);
}
