import { resolve, basename } from "path";
import { existsSync, readFileSync } from "fs";
import { readMidiSSE, readAsCSV } from "./read-midi-sse-csv";
import { WsSocket, WsServer, handleWsRequest } from "grep-wss";
import { createServer } from "https";
import { produce } from "./sound-sprites";
import { spawn, execSync, ChildProcess } from "child_process";
import { notelist, renderlist, midifiles, renderListStr } from "./filelist";
import { httpsTLS } from "./tls";
import { parseQuery, handlePost, queryFs, parseCookies } from "./fsr";
import { RemoteControl } from "./ssr-remote-control.types";
import { IncomingMessage } from "http";
import { info } from "console";

/*
   Server-Side Rendering of Low Latency 32-bit Floating Point Audio

  This file hosts two servers: @server:HttpsServer
    1. @server Https.Server traditional https which prints out the webpage (line 48-61), 
        and for streaming playback ()
    2. @wsServer WsServer  WebSocket server for interactivity with the stream (like a remote control)
*/
type WebSocketRefStr = string;
type SessionContext = {
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
  const who = cookies["username"] || query["cookie"] || process.hrtime()[0];
  activeSessions[who] = activeSessions[who] || {};
  return {
    ...activeSessions[who],
    who,
    parts,
    query,
  };
}

const indexHtml = readFileSync(resolve(__dirname, "../index.view.html"))
  .toString()
  .split(/\${}/);
const style = readFileSync("./style.css");
const wepbackJS = execSync("cat ./js/dist/main/*.js");

const server = createServer(httpsTLS, async (req, res) => {
  const {
    who,
    parts,
    wsRef,
    rc,
    parts: [p1, p2, p3],
  } = idUser(req);

  handlePost(req, res);
  queryFs(req, res);

  const file = resolve("midi", parts.shift());
  try {
    const preJS = "";
    switch (p1) {
      case "":
      case "samples":
        res.write(indexHtml[0]);
        res.write(style);
        res.write(preJS);
        res.write(indexHtml[1]);
        res.write(renderListStr());
        res.write(indexHtml[2]);
        res.write(wepbackJS);
        res.write(indexHtml[3]);
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
        res.writeHead(200, {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "audio/raw",
          "Cache-Control": "no-cache",
        });
        const rc: RemoteControl = produce(file, res);
        activeSessions[who].rc = rc;
        if (wsRef && wsRefs[wsRef]) {
          wsRefs[wsRef].prependListener("data", (d) => {
            const cmd = d.toString().split();
            switch (cmd.shift()) {
              case "play":
                rc.resume();
                break;
              case "stop":
              case "pause":
                rc.stop();
                break;
              case "morebass":
                break;
            }
          });
          const ws: WsSocket = wsRefs[wsRef];
          ["note", "#tempo", "#meta", "#time"].map((event) => {
            rc.emitter.on(event, (info) => {
              ws.write(JSON.stringify(info));
            });
          });
          activeSessions[who].rc.on("note", (note) =>
            ws.write(
              JSON.stringify({
                debug: `/mp3/${note.instrument}/${note.midi - 21}`,
                note: note.name,
              })
            )
          );
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
        res.end(p1);
        break;
    }
  } catch (e) {
    res.statusCode = 500;
    res.end(e.message);
    console.log(e);
  }
});

handleWsRequest(server, (uri: string) => {
  return (ws: WsSocket, req) => {
    wsRefs[ws.webSocketKey] = ws;

    const activeSession = idUser(req);
    activeSession.wsRef = ws.webSocketKey;

    ws.send("welcome");
  };
});

server.listen(443);

process.on("uncaughtException", (e) => {
  console.log("fuck ryan dahl", e);
});
process.stdin.on("data", (d) => {
  const cmd = d.toString().trim();
  cmd === "r" &&
    process.stdout.write(Buffer.from(JSON.stringify(activeSessions)));
  wsRefs[cmd] && wsRefs[cmd].write("HI");

  cmd === "p" && Object.values(activeSessions)[0].controller.pause();
});
