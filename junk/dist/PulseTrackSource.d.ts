/// <reference types="node" />
import { PulseSource, Envelope, SSRContext } from "ssr-cxt";
import { NoteEvent } from "./NoteEvent";
import { BufferIndex } from "./ssr-remote-control.types";
export declare class PulseTrackSource extends PulseSource {
    note: NoteEvent;
    trackId: number;
    bufferIndex: BufferIndex;
    envelope: Envelope;
    constructor(ctx: SSRContext, props: {
        bufferIndex?: BufferIndex;
        buffer?: Buffer;
        note: NoteEvent;
        trackId: number;
        velocity: number;
    });
    read(): Buffer;
}
