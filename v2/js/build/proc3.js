//@ts-ignore
class PlaybackProcessor //@ts-ignore
//@ts-ignore
 extends AudioWorkletProcessor {
    constructor() {
        super();
        this.buffers = [];
        const chunk = 128 * 4 * 2;
        this.port.onmessage = async ({ data: { readable } }) => {
            let that = this;
            const reader = await readable.getReader();
            reader.read().then(function process(result) {
                if (result.done)
                    return;
                let value = result.value;
                while (value.length >= chunk) {
                    const b = value.slice(0, chunk);
                    that.buffers.push(b);
                    value = value.slice(chunk);
                }
                reader.read().then(process);
            });
        };
    }
    process(inputs, outputs, parameters) {
        if (this.buffers.length < 1)
            return true;
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
