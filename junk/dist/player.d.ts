/// <reference types="node" />
import { PulseSource, SSRContext, Envelope } from "ssr-cxt";
import { Writable } from "stream";
import { RemoteControl } from "./ssr-remote-control.types";
import { NoteEvent } from "./NoteEvent";
declare class PulseTrackSource extends PulseSource {
    note: NoteEvent;
    trackId: number;
    envelope: Envelope;
    constructor(ctx: any, props: {
        buffer: Buffer;
        note: NoteEvent;
        trackId: number;
        velocity: number;
    });
}
export declare class Player {
    nowPlaying: RemoteControl;
    ctx: SSRContext;
    settings: {
        preamp: number;
        threshold: number;
        ratio: number;
        knee: number;
        playbackRate: number;
    };
    output: Writable;
    setSetting: (attr: any, value: any) => void;
    lastPlayedSettings: any;
    stop: () => void;
    msg: (msg: string, reply: {
        write: (string: any) => void;
    }) => void;
    playTrack: (file: string, output: Writable, autoStart?: boolean, playbackRate?: number) => RemoteControl;
    timer: NodeJS.Timeout;
    tracks: PulseTrackSource[];
}
export {};
