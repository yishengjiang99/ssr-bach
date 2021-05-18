import { PDTA } from "./pdta.js";
export declare class SF2File {
    pdta: PDTA;
    sdta: {
        nsamples: number;
        data: Uint8Array;
        floatArr: SharedArrayBuffer;
        iterator: any;
    };
    static fromURL: (url: string) => Promise<SF2File>;
    constructor(ab: ArrayBuffer | Uint8Array);
}
