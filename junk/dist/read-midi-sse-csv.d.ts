/// <reference types="node" />
import { EventEmitter } from "events";
import { Readable, Writable } from "stream";
export declare const readMidiSSE: ({ request, response, midifile, realtime, }: {
    request?: Readable;
    response: Writable;
    midifile: string;
    realtime: boolean;
}) => import("./ssr-remote-control.types").RemoteControl;
export declare function readAsCSV(midifile: string | EventEmitter): Readable;
