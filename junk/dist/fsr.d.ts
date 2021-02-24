/// <reference types="node" />
import { IncomingMessage, ServerResponse } from "http";
import { ServerHttp2Stream } from "http2";
export declare const dbfsroot: string;
export declare const parseQuery: (req: IncomingMessage) => [string[], Map<string, string>];
export declare const parseUrl: (url: string) => [string[], Map<string, string>];
export declare const mkfolder: (folder: any) => true | void;
export declare const resolvePath: (root: any, relativePath: any) => any;
export declare const handlePost: (req: IncomingMessage, res: ServerResponse, who?: string) => void;
export declare function parseCookies(request: any): {};
export declare const queryFs: (req: any, res: any, baseName?: string) => any;
declare type FD = number;
export declare function pushFile({ stream, file, path, }: {
    stream: ServerHttp2Stream;
    file: string | FD | Buffer | ReadableStream;
    path: string;
}): void;
export {};
