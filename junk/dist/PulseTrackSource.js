"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PulseTrackSource = void 0;
const ssr_cxt_1 = require("ssr-cxt");
class PulseTrackSource extends ssr_cxt_1.PulseSource {
    constructor(ctx, props) {
        super(ctx, { buffer: props.buffer });
        this.note = props.note;
        this.trackId = props.trackId;
        this.envelope = new ssr_cxt_1.Envelope(44100, [
            ((145 - props.velocity) / 144) * 0.1,
            0.1,
            0.4,
            0.4,
        ]);
    }
    read() {
        const n = this.ctx.blockSize;
        if (this.bufferIndex) {
        }
        else if (this.buffer.byteLength < this.ctx.blockSize) {
            const b = Buffer.alloc(n);
            b.set(this.buffer, 0);
            for (let i = this.buffer.byteLength; i < n - 2; i += 2) {
                b.writeInt16LE(0, i);
            }
            return b;
        }
        else {
            const ret = this.buffer.slice(0, n);
            this.buffer = this.buffer.slice(n);
            return ret;
        }
    }
}
exports.PulseTrackSource = PulseTrackSource;
