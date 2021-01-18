import { basename } from "path";
import { createReadStream, existsSync, readFileSync } from "fs";
import { readAsCSV } from "./read-midi-sse-csv";
import { WsSocket, shakeHand } from "grep-wss";
import { createServer, get } from "https";
import { spawn } from "child_process";

import { httpsTLS } from "./tls";
import {
  parseQuery,
  handlePost,
  queryFs,
  parseCookies,
  parseUrl,
  hotreloadOrPreload,
} from "./fsr";
import { SessionContext, WebSocketRefStr } from "./ssr-remote-control.types";
import { IncomingMessage } from "http";
import { Socket } from "net";
import { decodeWsMessage } from "grep-wss/dist/decoder";

import { handleSamples } from "./id2";
import { WAVheader } from "./utils";
import { Player } from "./player";
import { fileserver } from "./fileserver";
import { readdirSync } from "fs";
import { convertMidiSequencer } from "./convertMidiSequencer";
export const midifiles = readdirSync("./midi");

export class Server {
  precache: Map<string, Buffer> = new Map<string, Buffer>();
  activeSessions = new Map<string, SessionContext>();
  wsRefs: Map<WebSocketRefStr, WsSocket> = new Map<WebSocketRefStr, WsSocket>();
  server: import("https").Server;
  indexPageParts: string[];
  constructor(port, tls = httpsTLS) {
    process.env.port = port;
    const fssd = fileserver();
    this.server = createServer(tls, (req, res) => {
      if (req.url == "/fs") {
        return fssd(req, res);
      } else {
        return this.handler(req, res);
      }
    });

    this.server.on("upgrade", this.wshand);
    this.server.listen(port); //3000);

    process.on("uncaughtException", (e) => {
      console.log("f ", e);
    });
    this.indexPageParts = hotreloadOrPreload();
  }
  get httpsServer() {
    return this.server;
  }
  currentSession(who, parts, query) {
    return (this.activeSessions[who + ""] = {
      t: new Date(),
      player: new Player(),
      who,
      ...this.activeSessions[who + ""],
      parts,
      query,
    });
  }
  handler = async (req, res) => {
    try {
      let [idx, idx1, beforeMain, idx2, idx3, css] = this.indexPageParts; //();
      const session = this.idUser(req);
      const { who, parts, wsRef, rc } = session;

      if (req.url.includes("refresh")) {
        [idx, idx1, beforeMain, idx2, idx3, css] = hotreloadOrPreload();
      }

      const [_, p1, p2, p3] = parts;
      const file3 =
        parts[2] && existsSync("midi/" + decodeURIComponent(parts[2]))
          ? "midi/" + decodeURIComponent(parts[2])
          : "midi/song.mid";
      const file = file3 || parts[2] || "song.mid";
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
          res.write("</select> <button>Play</button><br><br>");
          res.write(`   
          <form action='/fs' method="post" enctype="multipart/form-data">
             <label for='uploadfile'>Upload Midi</label>
             <input name='file' id='uploadfile' value='file' multiple=true type='file' accept='*.mid' />
             <input type='submit' />
         </form>`);
          res.write(idx2);

          res.end(idx3);
          break;
        case "midi":
          res.writeHead(200, {
            "Content-Type": "text/HTML",
            "set-cookie": "who=" + who,
          });

          res.write(idx1);
          res.write(css);

          res.write(`<h3></h3><div class='fullscreen'><canvas></canvas></div>`);
          res.write("<script src='/js/build/panel.js'>");
          res.write(idx2);
          res.end(idx3);

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
        case "excel":
          const workbook = convertMidiSequencer({
            file: file,
            output: res,
          });
          console.log(workbook);
          res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          );
          res.setHeader("Content-Disposition", "attachment; filename=" + file + ".xlsx");

          workbook.xlsx.write(res).then(() => {
            res.end();
          });

          break;
        case "rt":
          res.writeHead(200, {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "text/csv",
            "Cache-Control": "no-cache",
          });
          let n = 10;
          readAsCSV("./midi/" + parts[2] || "song.mid", false).pipe(res);

          break;
        case "pcm":
          if (req.method === "POST") {
            const t = req.body.toString().trim().split(",");
            if (session.rc) {
              switch (t[0]) {
                case "pause":
                  session.rc.pause();
                  break;
                case "resume":
                  session.rc.resume();
                  break;
                case "seek":
                  session.rc.seek(parseInt(t[1]));
                  break;
                case "ff":
                  session.rc.ff();
                  break;
                case "rwd":
                  session.rc.rwd();
                  break;
                case "volume":
                  session.player.tracks[parseInt[t[1]]] = parseFloat[t[2]];
                  break; //.track = parseInt(t[1]);
                default:
                  break;
              }
            }
            return res.writeHead(200);
          }

          res.writeHead(200, {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "audio/raw",
            "Cache-Control": "no-cache",
            "Content-Disposition": "in-line",
            "x-bit-depth": 32,
            "x-sample-rate": 48000,
            "x-nchannel": 2,
          });
          if (session.player && session.player.output) session.player.output = null; // session.rc.stop();

          this.activeSessions[who].player.playTrack(file, res);
          this.activeSessions[who].rc = this.activeSessions[who].player.nowPlaying;
          const rc = this.activeSessions[who].rc;
          if (wsRef && this.wsRefs[wsRef]) {
            // this.wsRefs[wsRef].write(
            //   JSON.stringify({ event: "#meta", info: rc.state.tracks })
            // );
            // console.log(JSON.stringify({ event: "#meta", info: rc.state.tracks }));
            // const ws: WsSocket = this.wsRefs[wsRef];
            // readAsCSV(rc.emitter, true).on("data", (d) => {
            //   ws.write(d.toString());
            // });
            // rc.emitter.on("ack", ({ attr, value }) => {
            //   ws.write(JSON.stringify({ ack: { attr, value } }));
            // });
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

        case "upload":
          if (req.method === "POST") return handlePost(req, res, session.who);

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
  wshand = (req: IncomingMessage, _socket: Socket) => {
    shakeHand(_socket, req.headers);
    let activeSession = this.idUser(req);
    const wsSocket: WsSocket = new WsSocket(_socket, req);

    activeSession.wsRef = wsSocket.webSocketKey;
    this.wsRefs[wsSocket.webSocketKey] = wsSocket;
    wsSocket.send("welcome");
    _socket.on("data", (d) => {
      const msg = decodeWsMessage(d);
      fd(wsSocket, msg);
      activeSession.player.msg(msg.toString(), wsSocket);
      wsSocket.write("ack " + msg);
    });
  };
  idUser(req: IncomingMessage): SessionContext {
    const [parts, query] = parseQuery(req);
    var cookies = parseCookies(req);
    const who: string = cookies["who"] || query["cookie"] || process.hrtime()[0] + "";
    this.activeSessions[who] = {
      t: new Date(),
      player: new Player(),
      who,
      ...this.activeSessions[who],
      parts,
      query,
    };
    return this.activeSessions[who];
  }
}
if (require.main === module) {
  new Server(process.argv[2] || 8443);
}
function fd(wsSocket: WsSocket, msg: Buffer) {
  wsSocket.emit("data", msg);
}
