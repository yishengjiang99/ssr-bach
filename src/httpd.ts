import { resolve, basename } from "path";
import { existsSync, readdirSync, readFileSync } from "fs";
import { readMidiSSE, readAsCSV } from "./read-midi-sse-csv";
import { WsSocket, WsServer, handleWsRequest, shakeHand } from "grep-wss";
import { createServer } from "https";
import { produce } from "./sound-sprites";
import { spawn, execSync, ChildProcess } from "child_process";

import { httpsTLS } from "./tls";
import { parseQuery, handlePost, queryFs, parseCookies } from "./fsr";
import { RemoteControl } from "./ssr-remote-control.types";
import { IncomingMessage } from "http";
import { Socket } from "net";
import { decodeWsMessage } from "grep-wss/dist/decoder";
import { PassThrough } from "stream";
import { notelist } from "./filelist";

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
  wsRef?: WebSocketRefStr; //used to message user via ws during playback
  rc?: RemoteControl; //this controls active playback + the data channel actively piping to their browser
  ffspawn?: ChildProcess; //the ffmpeg filter
  file?: string; //file being played
  who: string; //randomly assigned username,
  parts: string[]; //currently requested path;
  query: Map<string, string>; // /index.php?a=3&b=3
};

const activeSessions = new Map<string, SessionContext>();
const wsRefs = new Map<WebSocketRefStr, WsSocket>();

function idUser(req: IncomingMessage): SessionContext {
  //not actual session. place holder for while server under 50 ppl.
  const [parts, query] = parseQuery(req);
  var cookies = parseCookies(req);
  console.log(cookies);
  const who = cookies["who"] || query["cookie"] || process.hrtime()[0] + "";
  return (activeSessions[who + ""] = {
    t: new Date(),
    ...activeSessions[who + ""],
    who,
    parts,
    query,
    file: existsSync("midi/" + parts[2]) ? "midi/" + parts[2] : "midi/song.mid",
  });
}
const idx = readFileSync("./index.html");

const handler = async (req: IncomingMessage, res) => {
  const session = idUser(req);
  const { who, parts, wsRef, rc, file } = session;
  if (parts[0] === "bach") parts.shift();

  if (req.method === "POST") return handlePost(req, res, session);

  try {
    switch (parts[1]) {
      case "":
        res.writeHead(200, {
          "Content-Type": "text/HTML",
          "set-cookie": "who=" + who,
        });

        res.write(idx.toString().split("</body>")[0]);
        res.end("<body></html>");
        break;
      case "samples":
        res.writeHead(200, {
          "Content-Type": "text/HTML",
          "set-cookie": "who=" + who,
        });

        notelist(res);
        break;

      case "js":
        console.log(req.url);
        if (basename(req.url) === "ws-worker.js") {
          res.writeHead(200, {
            "Content-Type": "application/javascript",
          });
          const str = readFileSync("./js/build/ws-worker.js")
            .toString()
            .replace("%WSHOST%", "wss://www.grepawk.com/?cookie=" + who);
          res.end(str);
        } else if (basename(req.url) === "proc2.js") {
          res.writeHead(200, {
            "Content-Type": "application/javascript",
          });
          res.end(readFileSync("./js/build/proc2.js"));
        } else {
          res.writeHead(200, {
            "Content-Type": "application/javascript",
          });
          res.end(readFileSync(resolve(__dirname, "../js/build/" + basename(req.url))));
        }
        break;

      case "rt":
        res.writeHead(200, {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "text/event-stream",
          Connection: "keep-alive",
          "Cache-Control": "no-cache",
        });
        readMidiSSE(req, res, file, true);
        break;
      case "pcm":
        const pt = new PassThrough();
        let rc: RemoteControl = produce(file, res, pt);
        res.writeHead(200, {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "audio/raw",
          "Cache-Control": "no-cache",
          "x-meta": JSON.stringify(rc.meta),
          "x-bit-depth": 32,
          "x-sample-rate": 48000,
          "x-nchannel": 2,
        });
        activeSessions[who].rc = rc;
        if (wsRef && wsRefs[wsRef]) {
          wsRefs[wsRef].write(JSON.stringify(rc.meta));
          wsRefs[wsRef].on("data", (d) => {
            const cmd = d.toString().split("/");
            switch (cmd.shift()) {
              case "resume":
                rc.start();
                break;
              case "backpressure":
                pt.write("backpressure");
                break;
              case "play":
                const url = basename(cmd[cmd.length - 1]);
                if (url !== file) {
                  rc.stop();

                  ws.write("new song " + url);
                  let newrc = produce(url, res, pt);
                  newrc.start();
                  rc = newrc;
                } else {
                  rc.resume();
                }
                ws.write("play");
                break;
              case "stop":
              case "pause":
                rc.pause();
                ws.write("paused");
                break;
              case "morebass":
                break;
            }
          });
          const ws: WsSocket = wsRefs[wsRef];
          ["#tempo", "#meta", "#time"].map((event) => {
            rc.emitter.on(event, (info) => {
              ws.write(JSON.stringify(info));
            });
          });
        }
        break;
      case "rfc":
        require("./grep-rfc").rfcGet(req, res, session);
        break;
      case "csv":
        res.writeHead(200, {
          "Content-Type": "plain/text",
          // "Content-Disposition": `inline; filename="${file}.csv"`,
        });
        res.write("<html><body><pre>");
        readAsCSV(file, false).pipe(res);
        res.write("</pre></body></html>");
        break;

      case "mp3":
        let p2 = parts.shift(),
          p3 = parts.shift();
        let ffc;
        if (p2.endsWith(".mp3")) {
          let t = parseInt(p3.replace(".mp3", "")) * 123;
          ffc = "./mp3/FatBoy_" + p2 + ".js";
          const proc = spawn(
            "ffmpeg",
            `-f mp3 -i ${ffc} -ss ${t} -d 2 -f mp3 -`.split(" ")
          );

          proc.stdout.on("error", (d) => console.error(d.toString()));
          proc.stdout.pipe(res);
        } else if (!existsSync("./midisf/" + p2 + "/" + p3 + ".pcm")) {
          res.writeHead(404);
        } else ffc = "./midisf/" + p2 + "/" + p3 + ".pcm";

        res.writeHead(200, { "Content-Type": "audio/mp3" });

        spawn(
          "ffmpeg",
          `-f f32le -ar 48000 -ac 1 -i ${ffc} -af volume=0.5 -f mp3 -`.split(" ")
        ).stdout.pipe(res);

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
        queryFs(req, res) || res.writeHead(404);

        break;
    }
  } catch (e) {
    res.statusCode = 500;
    res.end(e.message);
    console.log(e);
  }
};

const wshand = (req: IncomingMessage, _socket: Socket) => {
  shakeHand(_socket, req.headers);
  const activeSession = idUser(req);
  const wsSocket: WsSocket = new WsSocket(_socket, req);

  activeSession.wsRef = wsSocket.webSocketKey;
  wsRefs[wsSocket.webSocketKey] = wsSocket;
  wsSocket.send("welcome");
  _socket.on("data", (d) => {
    const msg = decodeWsMessage(d);
    wsSocket.emit("data", msg);
  });
};

const server = createServer(httpsTLS, handler);
server.on("upgrade", wshand);
server.listen(443); //3000);
process.on("uncaughtException", (e) => {
  console.log("f ryan dahl", e);
});
process.stdin.on("data", (d) => {
  const cmd = d.toString().trim().split(" ");
  console.log(
    activeSessions.forEach((ses) => {
      const { rc, who, query, parts } = ses;
      console.log(rc);
      console.log(who, query, parts);
    })
  );
  if (cmd[0] === "g") {
    Object.values(activeSessions).map((ses) => {
      const { rc, who, query, parts } = ses;
      console.log(rc);
      console.log(who, query, parts);
    });
  }
  let proxyUser;
  if (proxyUser !== null) {
    switch (cmd.shift()) {
      case "r":
      case "resume":
        proxyUser.rc.resume();
        break;
      case "backpressure":
        proxyUser.rt.write("backpressure");
        break;
      case "p":
      case "play":
        const url = basename(cmd[cmd.length - 1]);
        if (url !== proxyUser.rt.filename) {
          proxyUser.rc.stop();
        } else {
          proxyUser.rc.resume();
        }
        (wsRefs[cmd[0]] && wsRefs[cmd.join("")]).write("play");
        break;
      case "stop":
      case "pause":
        proxyUser.rc.pause();
        proxyUser.rc.ws.write("paused");
        break;
      case "morebass":
        break;
    }
  }
  if (activeSessions[cmd.join("")]) {
    let proxyUser = activeSessions[cmd.join("")];
    console.log("sudo for ", proxyUser);
  }
  wsRefs[cmd[0]] && wsRefs[cmd.join("")].write("HI");
});
