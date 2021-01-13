import { resolve, basename } from "path";
import {
  createReadStream,
  existsSync,
  openSync,
  readdirSync,
  readFileSync,
  readSync,
} from "fs";
import { readMidiSSE, readAsCSV } from "./read-midi-sse-csv";
import { WsSocket, WsServer, handleWsRequest, shakeHand, header } from "grep-wss";
import { createServer, request, get } from "https";
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
import {
  Http2Stream,
  createSecureServer,
  ServerHttp2Stream,
  IncomingHttpHeaders,
} from "http2";
import { handleSamples } from "./id2";
import { cspawn, midiMeta, tagResponse, WAVheader } from "./utils";
import { Player } from "./player";
import { stdformat } from "./ffmpeg-templates";
import { bitmapget } from "./soundPNG";

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

function idUser(req: IncomingMessage): SessionContext {
  //not actual session. place holder for while server under 50 ppl.
  const [parts, query] = parseQuery(req);
  var cookies = parseCookies(req);
  const who = cookies["who"] || query["cookie"] || process.hrtime()[0] + "";
  return currentSession(who, parts, query);
}
function currentSession(who, parts, query) {
  return (activeSessions[who + ""] = {
    t: new Date(),
    player: new Player(),
    who,
    ...activeSessions[who + ""],
    parts,
    query,
  });
}
let page2html = readFileSync("fullscreen.html").toString();
let precache = [
  "fetchworker.js",
  "proc2.js",
  "panel.js",
  "misc-ui.js",
  "analyserView.js",
].reduce((map, entry) => {
  map["./js/build/" + entry] = readFileSync("./js/build/" + entry).toString();
  return map;
});
export const run = (port, tls = httpsTLS) => {
  process.env.port = port;

  // page2preload = (() => {
  //   let page2html = readFileSync("fullscreen.html").toString();
  //   let precache = [
  //     "fetchworker.js",
  //     "proc2.js",
  //     "panel.js",
  //     "misc-ui.js",
  //     "analyserView.js",
  //   ].reduce((map, entry) => {
  //     map["./js/build/" + entry] = readFileSync("./js/build/" + entry).toString();
  //     return map;
  //   }, {});
  //   let [idx, idx1, beforeMain, idx2, idx3, css] = hotreloadOrPreload("fullscreen.html");
  //   precache["style.css"] = readFileSync("./style.css").toString();
  //   return {
  //     page2html,
  //     precache,
  //     idx,
  //     idx1,
  //     beforeMain,
  //     idx2,
  //     idx3,
  //     css,
  //   };
  // })();
  const server = createSecureServer(tls, handler);
  server.on("stream", handleStream);

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
export function handleStream(
  stream: ServerHttp2Stream,
  headers: IncomingHttpHeaders,
  flags: number
) {
  let m = headers[":path"].match(/\/midi\/(\S+)/);
  if (!m) {
    return;
  }
  const { page2html, precache, idx, idx1, beforeMain, idx2, idx3, css } = page2preload;
  const file = resolve("midi/" + decodeURIComponent(m[1].replace(".html", "")));
  if (!existsSync(file)) {
    stream.respond({
      ":status": 404,
    });
    return stream.end();
  }
  stream.respond(
    {
      ":status": 200,
      "Content-Type": "text/html",
    },
    { waitForTrailers: true }
  );
  const [parts, query] = parseUrl(headers[":path"]);

  currentSession(query["cookie"], parts, query);
  const meta = midiMeta(file);
  const h = (str: TemplateStringsArray, ...args) => {
    for (const st of str.entries()) {
      stream.write(st);
      stream.write(args.shift());
    }
  };
  stream.write(/* html */ `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${file}</title>
        <style>${css}</style>
      </head>
      <body>g
        <div class="fullscreen">
          <canvas></canvas>
        </div>g
        <div id="panel"></div>
        <pre id="stdout"></pre>
        <script type="module" src="/js/build/panel.js"></script>
      </body>
    </html>
`);
  // res.write(idx2);
}
const wavheader = Buffer.allocUnsafe(56);
openSync("./cachedheader.WAV", "r");
readSync(openSync("./cachedheader.WAV", "r"), wavheader, 0, 56, 0);

export function hotreloadOrPreload(url = "./index.html") {
  let idx = readFileSync(url).toString();
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
    if (req.method === "POST") return handlePost(req, res, session.who);

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
        res.write("<select id='menu'>");
        midifiles.forEach((name) =>
          res.write(`<option value='${name}'>${name}</option>`)
        );
        res.write("</select> <button>Play</button>");
        res.write(idx2);

        res.end(idx3);

        break;
      case "midi":
        // res.writeHead(200, {
        //   "Content-Type": "text/HTML",
        //   "set-cookie": "who=" + who,
        // });
        // res.write(idx1);
        // res.write(css);

        // res.write(`<h3></h3><div class='fullscreen'><canvas></canvas></div>`);
        // res.write("<script src='/js/build/panel.js'>");
        // // res.write(idx2);
        // res.end(idx3);

        break;
      case "js":
        res.writeHead(200, {
          "Content-Type": "application/javascript",
        });
        if (basename(req.url) === "ws-worker.js") {
          const str = readFileSync("./js/build/ws-worker.js")
            .toString()
            .replace("%WSHOST%", "wss://www.grepawk.com:" + process.env.port);
          res.end(str);
        } else {
          createReadStream("./js/build/" + basename(req.url)).pipe(res);
        }
        break;

      case "rt":
        res.writeHead(200, {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "text/event-stream",
          Connection: "keep-alive",
          "Cache-Control": "no-cache",
        });
        // activeSessions[who].rc.on("#note")
        ["note", "#meta", "#time", "#tempo"].map((event) => {
          activeSessions[who].rc.emitter.on(event, (d) => {
            res.write(
              ["event: ", event, "\n", "data: ", JSON.stringify(d), "\n\n"].join("")
            );
          });
        });
        //   readMidiSSE(req, res, file3, true);

        break;
      case "pcm":
        const file = file3 || parts[2] || "song.mid";

        res.writeHead(200, {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "audio/raw",
          "Cache-Control": "no-cache",
          "Content-Disposition": "in-line",
          "x-bit-depth": 32,
          "x-sample-rate": 48000,
          "x-nchannel": 2,
        });
        activeSessions[who].player.playTrack(file, res);
        activeSessions[who].rc = activeSessions[who].player.nowPlaying;
        const rc = activeSessions[who].rc;
        if (wsRef && wsRefs[wsRef]) {
          wsRefs[wsRef].write(JSON.stringify(rc.meta));
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

      case "proxy":
        const remoteUrl =
          "https://grep32bit.blob.core.windows.net/pcm/" + basename(req.url); // //'pcm/14v16.pc'

        get(
          remoteUrl,
          {
            headers: {
              range: "bytes=0-102400",
            },
          },
          (fres) => {
            const bytes = fres.headers["content-length"];
            res.write(WAVheader(parseInt(bytes) / 4));

            fres.pipe(res);
          }
        );
        res.writeHead(200, {
          "Access-Control-Allow-Origin": "*",
          "content-type": "audio/wav",
        });

        const queries = parseUrl(req.url);
        const vol = queries["vol"] || 1;
        //  cspawn(`ffmpeg ${stdformat} -i ${remoteUrl} -f WAV -`).stdout.pipe(res);
        break;

      default:
        if (req.method === "POST") handlePost(req, res, session.who);
        else queryFs(req, res) || res.writeHead(404);

        break;
    }
  } catch (e) {
    res.statusCode = 500;
    res.end(e.message);
  }
};

export const handleRemoteControl = function (
  player: Player,
  msg: string,
  ws,
  activeSession
) {
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
    case "play":
      const request = resolve("midi/" + basename(arg1));
      if (rc.state.midifile !== request) {
        rc.stop();
        player.playTrack(request, player.output);
        activeSession.rc = player.nowPlaying;
      } else {
        rc.resume();
      }

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
    handleRemoteControl(activeSession.player, msg.toString(), wsSocket, activeSession);
    wsSocket.write("ack " + msg);
  });
};

if (require.main === module) {
  run(process.argv[2] || 443);
}
function fd(wsSocket: WsSocket, msg: Buffer) {
  wsSocket.emit("data", msg);
}
