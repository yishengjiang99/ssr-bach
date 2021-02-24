/// <reference types="node" />
import { ServerHttp2Stream } from "http2";
declare type FD = number;
export declare function pushFile({ stream, file, path, }: {
    stream: ServerHttp2Stream;
    file: string | FD | Buffer | ReadableStream;
    path: string;
}): void;
export {};
