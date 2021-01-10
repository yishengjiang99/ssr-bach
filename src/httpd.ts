import { resolve, basename } from "path";
import { existsSync, readdirSync, readFileSync } from "fs";
import { readMidiSSE, readAsCSV } from "./read-midi-sse-csv";
import { WsSocket, WsServer, handleWsRequest, shakeHand } from "grep-wss";
import { createServer } from "https";
import { produce } from "./sound-sprites";
import { spawn, execSync, ChildProcess } from "child_process";

import { httpsTLS } from "./tls";
import { parseQuery, handlePost, queryFs, parseCookies, parseUrl, pushFile } from "./fsr";
import { RemoteControl } from "./ssr-remote-control.types";
import { IncomingMessage } from "http";
import { Socket } from "net";
import { decodeWsMessage } from "grep-wss/dist/decoder";
import { PassThrough } from "stream";
import { midifiles, notelist } from "./filelist";
import { Http2Stream, createSecureServer, ServerHttp2Stream } from "http2";
import { handleSamples } from "./id2";
import { midiMeta } from "./utils";
import * as multiparty from "multiparty";
import { Player } from "./player";

/*
   Server-Side Rendering of Low Latency 32-bit Floating Point Audio

  This file hosts two servers: @server:HttpsServer
    1. @server Https.Server traditional https which prints out the webpage (line 48-61), 
        and for streaming playback ()
    2. @wsServer WsServer  WebSocket server for interactivity with the stream (like a remote control)
*/
type WebSocketRefStr = string;
export type SessionContext = {
  t?: any;
  player: Player;
  wsRef?: WebSocketRefStr; //used to message user via ws during playback
  rc?: RemoteControl; //this controls active playback + the data channel actively piping to their browser
  ffspawn?: ChildProcess; //the ffmpeg filter
  file?: string; //file being played
  who: string; //randomly assigned username,
  parts: string[]; //currently requested path;
  query: Map<string, string>; // /index.php?a=3&b=3
};
let activeSessions = new Map<string, SessionContext>();
let wsRefs = new Map<WebSocketRefStr, WsSocket>();
let [idx, idx1, beforeMain, idx2, idx3, css] = hotreloadOrPreload();

export const run = (port, tls = httpsTLS) => {
  process.env.port = port;
  const server = createServer(tls, handler);

  process.on("uncaughtException", (e) => {
    console.log("f ", e);
  });

  server.on("upgrade", wshand);
  server.listen(port); //3000);
  return {
    activeSessions,
    server,
  };
};

function idUser(req: IncomingMessage): SessionContext {
  //not actual session. place holder for while server under 50 ppl.
  const [parts, query] = parseQuery(req);
  var cookies = parseCookies(req);
  const who = cookies["who"] || query["cookie"] || process.hrtime()[0] + "";
  return (activeSessions[who + ""] = {
    t: new Date(),
    player: new Player(),
    who,
    ...activeSessions[who + ""],

    parts,
    query,
  });
}
export function hotreloadOrPreload() {
  let idx = readFileSync("./index.html").toString();
  let idx1 = idx.split("<style></style>")[0];
  let beforeMain = idx.substr(idx1.length).split("<main></main>")[0] + "<main>";
  let idx2 = idx.substr(idx1.length + beforeMain.length).split("</body>")[0];
  let idx3 = "</body></html>";
  let css = "<style>" + readFileSync("./style.css").toString() + "</style>";
  return [idx, idx1, beforeMain, idx2, idx3, css];
}

export const handler = async (req, res) => {
  try {
    const session = idUser(req);
    const { who, parts, wsRef, rc } = session;
    if (req.url.includes("refresh")) {
      [idx, idx1, beforeMain, idx2, idx3, css] = hotreloadOrPreload();
    }

    const [_, p1, p2, p3] = parts;
    const file3 =
      parts[2] && existsSync("midi/" + decodeURIComponent(parts[2]))
        ? "midi/" + decodeURIComponent(parts[2])
        : "midi/song.mid";

    switch (parts[1]) {
      case "":
        res.writeHead(200, {
          "Content-Type": "text/HTML",
          "set-cookie": "who=" + who,
        });
        res.write(idx1);
        res.write(css);

        res.write(beforeMain);
        res.write("<ul id='menu'>");
        midifiles.forEach((name) =>
          res.write(`<li>${name}<a href='#${name}'>Play</a></li>`)
        );
        res.write("</ul>");
        res.write(idx2);
        res.end(idx3);

        break;
      case "js":
        if (basename(req.url) === "ws-worker.js") {
          res.writeHead(200, {
            "Content-Type": "application/javascript",
          });
          const str = readFileSync("./js/build/ws-worker.js")
            .toString()
            .replace("%WSHOST%", "wss://www.grepawk.com:" + process.env.port);
          res.end(str);
        } else {
          queryFs(req, res);
        }
        break;

      case "rt":
        res.writeHead(200, {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "text/event-stream",
          Connection: "keep-alive",
          "Cache-Control": "no-cache",
        });
        readMidiSSE(req, res, file3, true);
        break;
      case "pcm":
        const file = file3 || parts[2] || "song.mid";

        res.writeHead(200, {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "audio/raw",
          "Cache-Control": "no-cache",

          "x-bit-depth": 32,
          "x-sample-rate": 48000,
          "x-nchannel": 2,
        });
        activeSessions[who].player.playTrack(file, res);
        activeSessions[who].rc = activeSessions[who].player.nowPlaying;
        const rc = activeSessions[who].rc;
        if (wsRef && wsRefs[wsRef]) {
          wsRefs[wsRef].write(JSON.stringify(rc.meta));
          wsRefs[wsRef].on("data", (d) => {
            console.log("d" + d.toString());
          });
          const ws: WsSocket = wsRefs[wsRef];
          ["#tempo", "#meta", "#time", "ack"].map((event) => {
            let eventName = event;
            rc.emitter.on(event, (info) => {
              ws.write(JSON.stringify({ event: eventName, info }));
            });
          });
          rc.emitter.on("ack", ({ attr, value }) => {
            ws.write(JSON.stringify({ ack: { attr, value } }));
          });
        }
        break;
      case "rfc":
        require("./grep-rfc").rfcGet(req, res, session);
        break;

      case "samples":
        handleSamples(session, res);
        break;
      case "notes":
        if (!existsSync("./midisf/" + p2 + "/" + p3 + ".pcm")) res.writeHead(404);
        res.writeHead(200, { "Content-Type": "audio/raw" });
        const filename = "./midisf/" + p2 + "/" + p3 + ".pcm";
        spawn(
          "ffmpeg",
          `-f f32le -ar 48000 -ac 1 -i ${filename} -af volume=0.5 -f f32le -ac 2 -ar 48000 -`.split(
            " "
          )
        ).stdout.pipe(res);
        // createReadStream("./midisf/" + p2 + "/" + p3 + ".pcm").pipe(res);
        break;

      default:
        if (req.method === "POST") handlePost(req, res, session);
        queryFs(req, res) || res.writeHead(404);

        break;
    }
  } catch (e) {
    res.statusCode = 500;
    res.end(e.message);
    console.log(e);
  }
};

export const handleRemoteControl = function (player: Player, msg: string, ws) {
  let tt: string[] = msg.split(" ");
  const [cmd, arg1, arg2] = [tt.shift(), tt.shift(), tt.shift()];
  if (cmd === "config") {
    player.setSetting(arg1, parseFloat(arg2));
    ws.write("ack config " + arg1 + " " + arg2);
    return;
  }
  if (player.nowPlaying === null) {
    ws.write("not currenting playing anything");
    return;
  }
  let rc = player.nowPlaying;
  switch (cmd) {
    case "resume":
      rc.resume();
      break;
    case "stop":
      rc.stop();
      rc.emitter.removeAllListeners();
      player.nowPlaying = null;
      break;
    case "pause":
      rc.pause();
      break;
    default:
      ws.write("unknown handler " + cmd);
  }
};
export const wshand = (req: IncomingMessage, _socket: Socket) => {
  shakeHand(_socket, req.headers);
  const activeSession = idUser(req);
  const wsSocket: WsSocket = new WsSocket(_socket, req);

  activeSession.wsRef = wsSocket.webSocketKey;
  wsRefs[wsSocket.webSocketKey] = wsSocket;
  wsSocket.send("welcome");
  _socket.on("data", (d) => {
    const msg = decodeWsMessage(d);
    fd(wsSocket, msg);
    handleRemoteControl(activeSession.player, msg.toString(), wsSocket);
    wsSocket.write("ack " + msg);
  });
};

if (require.main === module) {
  run(process.argv[2] || 443);
}
function fd(wsSocket: WsSocket, msg: Buffer) {
  wsSocket.emit("data", msg);
}
