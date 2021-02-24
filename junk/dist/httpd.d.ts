/// <reference types="node" />
import { WsSocket } from "grep-wss";
import { IncomingMessage, ServerResponse } from "http";
import { Socket } from "net";
import { SessionContext, WebSocketRefStr } from "./ssr-remote-control.types";
import { HTML } from "./HTML";
export declare const midifiles: string[];
export declare class Server {
    precache: Map<string, Buffer>;
    activeSessions: Map<string, SessionContext>;
    wsRefs: Map<WebSocketRefStr, WsSocket>;
    server: import("https").Server;
    indexPageParts: HTML;
    port: any;
    host: string;
    constructor(port: any, host?: string, tls?: {
        key: Buffer;
        cert: Buffer;
    });
    start(): void;
    get httpsServer(): import("https").Server;
    currentSession({ who, parts, query }: {
        who: any;
        parts: any;
        query: any;
    }): any;
    handler: (req: IncomingMessage, res: ServerResponse) => Promise<void>;
    wshand: (req: IncomingMessage, _socket: Socket) => void;
    private severjsfiles;
    private sampleNote;
    private playback;
    private playbackUpdate;
    idUser(req: IncomingMessage): SessionContext;
}
