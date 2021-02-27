/* eslint-disable radix */
/* eslint-disable no-case-declarations */
/* eslint-disable no-return-assign */
import { basename, resolve } from "path";
import { createReadStream, existsSync, readFileSync, readdirSync } from "fs";
import { WsSocket, shakeHand } from "grep-wss";
import { createServer } from "https";
import { IncomingMessage, ServerResponse } from "http";
import { Socket } from "net";
import { decodeWsMessage } from "grep-wss/dist/decoder";
import { httpsTLS } from "./tls";
import {
  parseQuery,
  handlePost,
  queryFs,
  parseCookies
} from "./fsr";
import { SessionContext, WebSocketRefStr } from "./ssr-remote-control.types";
import { readAsCSV, readMidiSSE } from "./read-midi-sse-csv";
import { PassThrough } from "stream";
import { handleSamples } from "./sound-font-samples";
import { sleep, tagResponse } from "./utils";
import { cspawn } from "./cspawn";
import { Player } from "./xplayer";
import { fileserver } from "./fileserver";
import { Workbook } from "exceljs";
import { stdformat } from "./ffmpeg-templates";
import { convertMidi, convertMidiRealTime } from "./load-sort-midi";
import { memcopy } from "./resolvebuffer";
import { HTML, hotreloadOrPreload } from "./HTML";
export const midifiles = readdirSync("./midi");

export class Server {
  precache: Map<string, Buffer> = new Map<string, Buffer>();

  activeSessions = new Map<string, SessionContext>();

  wsRefs: Map<WebSocketRefStr, WsSocket> = new Map<WebSocketRefStr, WsSocket>();

  server: import("https").Server;

  indexPageParts: HTML;
  port: any;
  host: string;

  constructor(port, host: string = "https://www.grepawk.com", tls = httpsTLS) {
    process.env.port = port;
    const fssd = fileserver();
    this.indexPageParts = hotreloadOrPreload();

    this.server = createServer(tls, (req, res): any => {
      console.log(req.url);
      if (req.url.startsWith("/fs"))
      {
        return fssd(req, res);
      } else return this.handler(req, res);
    });

    this.server.on("upgrade", this.wshand);
    this.port = port;
    this.host = host;
  }
  start() {
    console.log("starting server on :" + this.host, this.port);
    this.server.listen(this.port, this.host); // 3000);
  }

  get httpsServer() {
    return this.server;
  }

  currentSession({ who, parts, query }: { who; parts; query }) {
    return (this.activeSessions[`${who}`] = {
      t: new Date(),
      player: new Player(),
      who,
      ...this.activeSessions[`${who}`],
      parts,
      query,
    });
  }

  handler = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    try
    {
      const indexhtml = this.indexPageParts;
      let { header, beforeMain, afterMain, end, css } = indexhtml; // ();
      const session = this.idUser(req);
      const { who, parts } = session;

      if (req.url.includes("refresh"))
      {
        let html = hotreloadOrPreload();
        let { header, beforeMain, afterMain, end, css } = html
      }

      const [, , p2, p3] = parts;
      const file3 =
        parts[2] && existsSync(`midi/${decodeURIComponent(parts[2])}`)
          ? `midi/${decodeURIComponent(parts[2])}`
          : "midi/song.mid";

      const file = file3 || parts[2] || "song.mid";

      // if(parts[1].match(/(\w).mid/)){
      //   return midiapp(req,res);

      // }
      switch (parts[1])
      {
        case "":
          res.writeHead(200, {
            "Content-Type": "text/HTML",
            "set-cookie": `who=${who}`,
          });
          res.write(header);
          res.write(css);

          res.write(beforeMain);

          const selectbar = /* html */ `
          <select id='menu'>
          ${midifiles.map(
            (name) => /* html */ `<option value='${name}'>${name}</option>`
          )}
          </select>
          
          <div id='cp'> 
            <button id='start'>
            Play/Pause
            </button>
          </div>
          ${midifiles.map(f => /*html*/`           
          <article class="relative br2 mv3 mv3-m mv4-l shadow-6">
              <a class="pointer no-underline fw4 white underline-hover" href="${f}"
                title="${f}">

                <div class="br2 bg-dark-blue pv2 ph3 flex br--bottom">
                  <h2 class="flex-auto f4 mv0 lh-copy truncate underline-hover">
                    ${f}
                  </h2>
                </div>
              </a>
            </article>`)}
          <footer>
          ${"pause,resume,ff,rwd,next,prev,play"
              .split(",")
              .map(
                (msg) => /* html */ `
          <button msg='${msg}'>${msg}</button>
          `
              )
              .join("")}</footer>`;

          res.write(selectbar);

          res.write(/*html*/ `
          <aside>
             <form action='/fs' method="post" enctype="multipart/form-data">
               <label for='uploadfile'>Upload Midi</label>
               <input name='file' id='uploadfile' value='file' multiple=true type='file' accept='*.mid' />
               <input type='submit' />
            </form>
            </aside>
          `);
          res.write(afterMain);
          res.end(end);
          break;
        case "midi":
          if (p2 === "js") return queryFs(req, res);

          res.writeHead(200, {
            "Content-Type": "text/HTML",
            "set-cookie": `who=${who}`,
          });
          res.write(header);
          res.write(css);
          res.write(beforeMain);
          res.write(`<iframe src='/excel/${basename(file)}'></iframe>`); //

          res.end(end);
          break;
        case "js":
          this.severjsfiles(res, req);
          break;
        case "sf":
          console.log(parts);
          const [offset, looplength, endloop, pitchratio] = parts[2].split("_").map((n, i) => {
            if (i < 3) return parseInt(n);
            else return parseFloat(n);
          })
          const ob = Buffer.alloc(48000);
          //@ts-ignore
          memcopy({ offset, endloop, pitchratio, looplength }, ob, 24000);
          res.end(ob);

          break;
        case "excel":
          res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          );
          res.setHeader("Content-Disposition", "attachment; filename=Report.xlsx");
          const wbook = new Workbook();

            
          break;
        case "rt":
          res.writeHead(200, {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
          });
          const rc = convertMidiRealTime(file);

          ["note", "#meta", "#time", "#tempo"].map((event) => {
            rc.emitter.on(event, (d) => {
              res.write(
                ["event: ", event, "\n", "data: ", JSON.stringify(d), "\n\n"].join("")
              );
            });
          });
          break;
        case "pcm":
          if (req.method === "POST")
          {
            this.playbackUpdate(req, session, res);
          } else
          {
            this.playback(res, session, who, file);
          }
          break;

        case "samples":
          handleSamples(session, res);
          break;
        case "notes":
          this.sampleNote(p2, p3, res);
          break;

        case "dbfs": //fallthrough
        case "upload":
          if (req.method === "POST") return handlePost(req, res, session.who);

          break;
        case "proxy":
          const remoteUrl = `https://grep32bit.blob.core.windows.net/pcm/${basename(
            req.url
          )}`; // //'pcm/14v16.pc'
          res.writeHead(200, {
            "Access-Control-Allow-Origin": "*",
            "content-type": "audio/wav",
          });

          cspawn(`ffmpeg ${stdformat} -i ${remoteUrl} -f WAV -`).stdout.pipe(res);
          break;

        default:
          if (req.method === "POST") handlePost(req, res, session.who);
          else queryFs(req, res) || res.writeHead(404);

          break;
      }
    } catch (e)
    {
      res.statusCode = 500;
      res.end(e.message);
    }
  };

  wshand = (req: IncomingMessage, _socket: Socket): void => {
    shakeHand(_socket, req.headers);
    const activeSession = this.idUser(req);
    const wsSocket: WsSocket = new WsSocket(_socket, req);
    activeSession.wsRef = wsSocket.webSocketKey;
    this.wsRefs[wsSocket.webSocketKey] = wsSocket;
    wsSocket.send("welcome");
    _socket.on("data", function (d): void {
      const msg = decodeWsMessage(d);
      wsSocket.emit("data", msg);
      activeSession.player.msg(msg.toString(), wsSocket);
      wsSocket.write(`ack ${msg}`);
    });
  };

  private severjsfiles(res: ServerResponse, req: IncomingMessage) {
    res.writeHead(200, {
      "Content-Type": "application/javascript",
    });
    if (basename(req.url) === "ws-worker.js")
    {
      const str = readFileSync("./js/build/ws-worker.js")
        .toString()
        .replace("%WSHOST%", `wss://${this.host}:${process.env.port}`);
      res.end(str);
    } else
    {
      createReadStream(`./js/build/${basename(req.url)}`).pipe(res);
    }
  }

  private sampleNote(p2: string, p3: string, res: ServerResponse) {
    if (!existsSync(`./midisf/${p2}/${p3}.pcm`)) res.writeHead(404);
    res.writeHead(200, { "Content-Type": "audio/raw" });
    const filename = `./midisf/${p2}/${p3}.pcm`;
    cspawn(`ffmpeg
            -f f32le -ar 48000 -ac 1 -i ${filename} -af volume=0.5 -f f32le -ac 2 -ar 48000 -`).stdout.pipe(
      res
    );
  }

  private playback(
    res: ServerResponse,
    session: SessionContext,
    who: string,
    file: string
  ) {
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
  }

  private playbackUpdate(
    req: IncomingMessage,
    session: SessionContext,
    res: ServerResponse
  ) {
    req.on("data", (d: Buffer) => {
      const [cmd, ...args] = d.toString().split(",");
      switch (cmd)
      {
        case "pause":
          session.player.nowPlaying.pause();
          res.end(session.player.nowPlaying.state.paused);
          break;
        case "resume":
          session.player.nowPlaying.resume();
          res.end(session.player.nowPlaying.state.paused);
          break;
        case "seek":
          session.rc.seek(parseInt(args[0]));
          break;
        case "ff":
          session.rc.ff();
          break;
        case "rwd":
          session.rc.rwd();
          break;
        case "volume":
          session.player.tracks[args.shift()] = parseFloat(args.shift());
          break; // .track = parseInt(t[1]);
        default:
          break;
      }
    });
    res.end();
  }

  idUser(req: IncomingMessage): SessionContext {
    const [parts, query] = parseQuery(req);
    const cookies = parseCookies(req);
    const who: string = cookies["who"] || query["cookie"] || `${process.hrtime()[0]}`;
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

if (require.main === module && process.argv[3] === "yisheng")
{
  new Server(process.argv[2] || process.env.PORT, process.env.HOST).start();
}
process.on("uncaughtException", (e): void => {
  console.log("f ", e);
});

