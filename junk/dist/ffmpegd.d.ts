/// <reference types="node" />
import { PassThrough } from "stream";
export declare function ffjmpegd({ pitchRatio, inputSampleRate, outputSampleRate }: {
    pitchRatio: any;
    inputSampleRate: any;
    outputSampleRate: any;
}): {
    addBuffer: (_buffer: Buffer) => void;
    output: PassThrough;
    pid: number;
    runsample: (sample: Buffer) => Promise<unknown>;
};
