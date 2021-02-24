/// <reference types="node" />
import { Writable } from "stream";
export declare function convertMidiSequencer({ file, output, page }: {
    page?: number;
    file: any;
    output?: Writable;
}): Promise<[][]>;
