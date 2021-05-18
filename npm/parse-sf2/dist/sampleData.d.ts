import { Shdr } from "./index.js";
export declare class SampleData {
    uint8s: Uint8Array;
    floatArr: SharedArrayBuffer;
    constructor(rawData: Uint8Array);
    sampleBuffer({ start, end, startLoop, endLoop }: Shdr, pitchRatio?: number, length?: number): Generator<any, number, unknown>;
}
