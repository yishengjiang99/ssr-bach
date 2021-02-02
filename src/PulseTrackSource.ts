import { PulseSource, Envelope } from "ssr-cxt";
import { NoteEvent } from "./ssr-remote-control.types";

export class PulseTrackSource extends PulseSource {
  note: NoteEvent;
  trackId: number;
  envelope: Envelope;
  constructor(
    ctx,
    props: { buffer: Buffer; note: NoteEvent; trackId: number; velocity: number }
  ) {
    super(ctx, { buffer: props.buffer });
    this.note = props.note;
    this.trackId = props.trackId;
    this.envelope = new Envelope(48000, [
      ((145 - props.velocity) / 144) * 0.1,
      0.1,
      0.4,
      0.4,
    ]);
  }
}
