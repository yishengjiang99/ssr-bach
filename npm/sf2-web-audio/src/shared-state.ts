export class SharedState {
	u8: Uint8Array;
	u32: Uint32Array;
	f32: Float32Array;
	_struct: { name: string; width: number }[];
	constructor(buf: SharedArrayBuffer, offset: number, struct: { name: string; width: number }[]) {
		this.u8 = new Uint8Array(buf, offset);
		this.u32 = new Uint32Array(buf, offset);
		this.f32 = new Float32Array(buf, offset);
		this._struct = struct;
	}
}
