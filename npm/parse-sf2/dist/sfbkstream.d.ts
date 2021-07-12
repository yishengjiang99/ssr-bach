export declare function sfbkstream(url: string): Promise<{
    nsamples: number;
    sdtaStream: ReadableStream<any>;
    infos: any;
    pdtaBuffer: Uint8Array;
}>;
