import { resolve, basename } from "path";
import { existsSync, openSync, readdirSync, readFileSync, readSync } from "fs";
import { readMidiSSE, readAsCSV } from "./read-midi-sse-csv";
import { WsSocket, WsServer, handleWsRequest, shakeHand, header } from "grep-wss";
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
import {
  Http2Stream,
  createSecureServer,
  ServerHttp2Stream,
  IncomingHttpHeaders,
} from "http2";
import { handleSamples } from "./id2";
import { cspawn, midiMeta, tagResponse } from "./utils";
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
let page2preload;
export const run = (port, tls = httpsTLS) => {
  process.env.port = port;

  page2preload = (() => {
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
    }, {});
    let [idx, idx1, beforeMain, idx2, idx3, css] = hotreloadOrPreload("fullscreen.html");
    precache["style.css"] = readFileSync("./style.css").toString();
    return {
      page2html,
      precache,
      idx,
      idx1,
      beforeMain,
      idx2,
      idx3,
      css,
    };
  })();
  const server = createServer(tls, handler);
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
    if (req.method === "POST") return handlePost(req, res, session);

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
          res.write(
            `<li>${name}<a href='javascript://'><button  href='/pcm/${name}'>Play</button><a></li>`
          )
        );
        res.write("</ul>");
        res.write(idx2);
        // handleSamples(session, res);
        notelist(res);
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

      case "proxy":
        const remoteUrl =
          "https://grep32bit.blob.core.windows.net/pcm/" + basename(req.url); // //'pcm/14v16.pc'

        res.writeHead(200, {
          "Access-Control-Allow-Origin": "*",
          "content-type": "audio/wav",
        });
        const queries = parseUrl(req.url);
        const vol = queries["vol"] || 1;
        cspawn(`ffmpeg ${stdformat} -i ${remoteUrl} -f WAV -`).stdout.pipe(res);
        break;

      default:
        if (req.method === "POST") handlePost(req, res, session);
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
  run(process.argv[2] ||443);
}
function fd(wsSocket: WsSocket, msg: Buffer) {
  wsSocket.emit("data", msg);
}


export const produce = (
  songname: string,
  output: Writable = createWriteStream(songname + ".pcm"),
  interrupt: Readable = null,
  playbackRate: number = 1,
  autoStart: boolean = true
): RemoteControl => {
  const ctx = new SSRContext({
    nChannels: 2,
    bitDepth: 32,
    sampleRate: 48000,
    fps: 375,
  });
  const spriteBytePeSecond = ctx.bytesPerSecond;

  let intervalAdjust = 0;
  let settings = {
    preamp: 1,
    threshold: 55, //0.001
    ratio: 4,
    knee: 88,
  };
  const controller = convertMidi(songname);

  const tracks: PulseSource[] = new Array(controller.state.tracks.length);
  controller.setCallback(
    async (notes: NoteEvent[]): Promise<number> => {
      const startloop = process.uptime();

      notes.map((note, i) => {
        let velocityshift = 0; //note.velocity * 8;
        let fadeoutTime = (1 - note.velocity) / 10;
        const bytelength = spriteBytePeSecond * note.durationTime;
        let file;
        if (note.instrument.includes("piano")) {
          fadeoutTime = 0;
          velocityshift = 48;

          file = `./midisf/${note.instrument}/${note.midi - 21}v${
            note.velocity > 0.4 ? "16" : note.velocity > 0.23 ? "8.5-PA" : "1-PA"
          }.pcm`;
        } else {
          file = `./midisf/${note.instrument}/stero-${note.midi - 21}.pcm`;
        }

        if (!existsSync(file)) {
          file = `./midisf/clarinet/${note.midi - 21}.pcm`;
        } else {
          const fd = openSync(file, "r");

          const ob = Buffer.alloc(bytelength);
          if (note.durationTime < 1.0) {
            velocityshift = note.velocity * 1028;
          }
          readSync(fd, ob, 0, bytelength, 0);
          closeSync(fd);
          if (tracks[note.trackId]) {
            tracks[note.trackId].buffer = Buffer.alloc(0);
            tracks[note.trackId] = null;
            //to prevent overlap of sound frm same track..
          }
          tracks[note.trackId] = new PulseSource(ctx, {
            buffer: ob,
          });
        }
      });
      const elapsed = process.uptime() - startloop;
      await sleep(ctx.secondsPerFrame * 1000);
      return ctx.secondsPerFrame; // / 1000;
    }
  );
  let closed = false;

  if (autoStart) controller.start();
  output.on("close", (d) => {
    controller.stop();
    closed = true;
  });
  setInterval(() => {
    const { preamp, threshold, knee, ratio } = settings;
    // ctx.pump({ preamp, compression: { threshold, knee, ratio } });
    const summingbuffer = new DataView(Buffer.alloc(ctx.blockSize).buffer);
    let inputViews = tracks
      .filter((t, i) => t && t.buffer && t.buffer.byteLength >= ctx.blockSize)
      .map((t) => t.read());
    const n = inputViews.length;

    for (let k = 0; k < ctx.blockSize; k += 4) {
      let sum = 0;
      for (let j = n - 1; j >= 0; j--) {
        sum += inputViews[j].readFloatLE(k);
      }

      summingbuffer.setFloat32(k, sum, true);

      // summingbuffer.setFloat32(2 * k + 4, n, true);
    }

    output.write(Buffer.from(summingbuffer.buffer));
    //  console.log(".");
  }, ctx.secondsPerFrame * 1000);

  return controller;
};
