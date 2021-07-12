export class SharedState {
    constructor(buf, offset, struct) {
        this.u8 = new Uint8Array(buf, offset);
        this.u32 = new Uint32Array(buf, offset);
        this.f32 = new Float32Array(buf, offset);
        this._struct = struct;
    }
}
