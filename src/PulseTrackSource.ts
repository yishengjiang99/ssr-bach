import { PulseSource, Envelope, SSRContext } from "ssr-cxt";
import { NoteEvent } from "./NoteEvent";
import { BufferIndex } from "./ssr-remote-control.types";

export class PulseTrackSource extends PulseSource {
  note: NoteEvent;
  trackId: number;
  bufferIndex: BufferIndex;
  envelope: Envelope;
  constructor(
    ctx: SSRContext,
    props: { bufferIndex?:BufferIndex, buffer?: Buffer; note: NoteEvent; trackId: number; velocity: number }
  ) {
    super(ctx, { buffer: props.buffer });
    this.note = props.note;
    this.trackId = props.trackId;
    this.envelope = new Envelope(44100, [
      ((145 - props.velocity) / 144) * 0.1,
      0.1,
      0.4,
      0.4,
    ]);
  }
  read(): Buffer {
    const n = this.ctx.blockSize;
    if(this.bufferIndex){

    }
    else if (this.buffer.byteLength < this.ctx.blockSize) {
      const b = Buffer.alloc(n);
      b.set(this.buffer, 0);
      for (let i = this.buffer.byteLength; i < n - 2; i += 2) {
        b.writeInt16LE(0, i);
      }
      return b;
    } else {
      const ret = this.buffer.slice(0, n);
      this.buffer = this.buffer.slice(n);
      return ret;
    }
  }
}
