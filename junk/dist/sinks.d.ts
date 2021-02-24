/// <reference types="node" />
import { PassThrough, Readable, Writable } from "stream";
import { WriteStream } from "fs";
export declare const lowpassFilter: (cutoff: any) => {
    stdin: Writable;
    stdout: Readable;
};
export declare type FfpProps = {
    ar?: number;
    ac?: number;
    format?: string;
};
export declare const ffp: (props?: FfpProps) => Writable;
export declare const tmpOutput: () => WriteStream;
export declare const nc80: (port: any) => Writable;
export declare const devnull: () => PassThrough;
export declare const mp3c: () => [Writable, Readable, Readable];
