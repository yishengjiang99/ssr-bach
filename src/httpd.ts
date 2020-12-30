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
import { decodeWsMessage } from "grep-wss/dist/decoder.js";
import { PassThrough } from "stream";

/*
   Server-Side Rendering of Low Latency 32-bit Floating Point Audio

  This file hosts two servers: @server:HttpsServer
    1. @server Https.Server traditional https which prints out the webpage (line 48-61), 
        and for streaming playback ()
    2. @wsServer WsServer  WebSocket server for interactivity with the stream (like a remote control)
*/
type WebSocketRefStr = string;
type SessionContext = {
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
const style = readFileSync("./style.css");
const midifiles = readdirSync("./midi");

const server = createServer(httpsTLS, async (req, res) => {
  const { who, parts, wsRef, rc, file } = idUser(req);
  if (parts[0] === "bach") parts.shift();

  handlePost(req, res);

  try {
    switch (parts[1]) {
      case "":
      case "samples":
        res.writeHead(200, {
          "Content-Type": "text/HTML",
          "set-cookie": "who=" + who,
        });
        res.end(/* html */ `<!DOCTYPE html>
<html>
  <head>
    <style>
      ${style}
    </style>
  </head>
  <body>
 
      <div id='root' style='display:grid;grid-template-columns:1fr 1fr'>
    <span>  
    <button id='btn'>
      <svg id="playpause" width="100" height="100" viewBox="0 0 500 500">
      <defs>
        <path
          id="play"
          fill="currentColor"
          d="M424.4 214.7L72.4 6.6C43.8-10.3 0 6.1 0 47.9V464c0 37.5 40.7 60.1 72.4 41.3l352-208c31.4-18.5 31.5-64.1 0-82.6z"
        ></path>
        <path
          fill="currentColor"
          d="M144 479H48c-26.5 0-48-21.5-48-48V79c0-26.5 21.5-48 48-48h96c26.5 0 48 21.5 48 48v352c0 26.5-21.5 48-48 48zm304-48V79c0-26.5-21.5-48-48-48h-96c-26.5 0-48 21.5-48 48v352c0 26.5 21.5 48 48 48h96c26.5 0 48-21.5 48-48z"
          id="pause"
        ></path>
      </defs>
      <use x="5" y="5" href="#play" fill="currentColor" />
    </svg>
    </button></span>
    <span id='stats' width=50%>
    <div><label for='buffered'>Downloaded (kb): </label>
    <progress id='buffered' max='100'><span></span></div>
    <div> <label for='played'>Played (kb): </label><progress id='played' max='100'><span></span></div>
    <div> <label for='inmemory'>in memory: </label><meter id='inmemory' min='0' max='1000'><span></span></div>
    <div> <label for='loss'>Packet Loss (%): </label><meter id='loss' max='100'><span></span></div>
    </span>
    <div id='rx1'></div>
    <div id='log'></div>
</div>
<pre id='stdout'></pre>

  <ul style='display:none;background-color:rgba(0,0,0,0)'>      
  ${midifiles
    .map(
      (item) =>
        `<li>${item}<a style='cursor:pointer' href='#${item}'> read</a></li>`
    )
    .join("")}
</ul>
<div class='canvas_container'>
  <canvas></canvas>
</div>
  <script type='module' src="./js/build/index.js">  </script>
  </body>
</html>
`);
        break;
      case "js":
        console.log(req.url);
        if (basename(req.url) === "ws-worker.js") {
          res.writeHead(200, {
            "Content-Type": "application/javascript",
          });
          const str = readFileSync("./js/build/ws-worker.js")
            .toString()
            .replace("WHO", who);
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
          res.end(
            readFileSync(resolve(__dirname, "../js/build/" + basename(req.url)))
          );
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
                rc.resume();
                break;
              case "backpressure":
                pt.write("backpressure");
                break;
              case "play":
                const url = basename(cmd[cmd.length - 1]);
                if (url !== file) {
                  ws.write("new song " + url);
                  let newrc = produce(url, res, pt);
                  newrc.start();
                  rc = newrc;
                  //todo: crossfade this.
                  rc.stop();
                } else {
                  rc.resume();
                }
                ws.write("play");
                break;
              case "stop":
              case "pause":
                rc.stop();
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
      case "csv":
        res.writeHead(200, {
          "Content-Type": "text/csv",
          "Content-Disposition": `inline; filename="${file}.csv"`,
        });
        readAsCSV(file, false).pipe(res);
        break;
      case "mp3":
        let p2 = parts.shift(),
          p3 = parts.shift();
        let ffc;
        if (parts.shift().endsWith(".mp3")) {
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
          `-f f32le -ar 48000 -ac 1 -i ${ffc} -af volume=0.5 -f mp3 -`.split(
            " "
          )
        ).stdout.pipe(res);

        break;
      case "notes":
        if (!existsSync("./midisf/" + p2 + "/" + p3 + ".pcm"))
          res.writeHead(404);
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
}).on("upgrade", (req: IncomingMessage, _socket: Socket) => {
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
});

server.listen(443);

process.on("uncaughtException", (e) => {
  console.log("f ryan dahl", e);
});
process.stdin.on("data", (d) => {
  const cmd = d.toString().trim();
  cmd === "r" &&
    process.stdout.write(Buffer.from(JSON.stringify(activeSessions)));
  wsRefs[cmd] && wsRefs[cmd].write("HI");

  cmd === "p" && Object.values(activeSessions)[0].controller.pause();
});
