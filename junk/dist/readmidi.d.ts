/// <reference types="node" />
export declare function readMidi(buffer: Buffer): {
    tracks: any[];
    tempos: any[];
    timesigs: any[];
    metainfo: any[];
    readAt: (g_time: any, sp_hug: any) => void;
    tick: (signal: any) => void;
};
