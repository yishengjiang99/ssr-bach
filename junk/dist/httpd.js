"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Server = exports.midifiles = void 0;
/* eslint-disable radix */
/* eslint-disable no-case-declarations */
/* eslint-disable no-return-assign */
const path_1 = require("path");
const fs_1 = require("fs");
const grep_wss_1 = require("grep-wss");
const https_1 = require("https");
const decoder_1 = require("grep-wss/dist/decoder");
const tls_1 = require("./tls");
const fsr_1 = require("./fsr");
const sound_font_samples_1 = require("./sound-font-samples");
const cspawn_1 = require("./cspawn");
const xplayer_1 = require("./xplayer");
const fileserver_1 = require("./fileserver");
const exceljs_1 = require("exceljs");
const ffmpeg_templates_1 = require("./ffmpeg-templates");
const load_sort_midi_1 = require("./load-sort-midi");
const resolvebuffer_1 = require("./resolvebuffer");
const HTML_1 = require("./HTML");
exports.midifiles = fs_1.readdirSync("./midi");
class Server {
    constructor(port, host = "https://www.grepawk.com", tls = tls_1.httpsTLS) {
        this.precache = new Map();
        this.activeSessions = new Map();
        this.wsRefs = new Map();
        this.handler = async (req, res) => {
            try {
                const indexhtml = this.indexPageParts;
                let { header, beforeMain, afterMain, end, css } = indexhtml; // ();
                const session = this.idUser(req);
                const { who, parts } = session;
                if (req.url.includes("refresh")) {
                    let html = HTML_1.hotreloadOrPreload();
                    let { header, beforeMain, afterMain, end, css } = html;
                }
                const [, , p2, p3] = parts;
                const file3 = parts[2] && fs_1.existsSync(`midi/${decodeURIComponent(parts[2])}`)
                    ? `midi/${decodeURIComponent(parts[2])}`
                    : "midi/song.mid";
                const file = file3 || parts[2] || "song.mid";
                // if(parts[1].match(/(\w).mid/)){
                //   return midiapp(req,res);
                // }
                switch (parts[1]) {
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
          ${exports.midifiles.map((name) => /* html */ `<option value='${name}'>${name}</option>`)}
          </select>
          
          <div id='cp'> 
            <button id='start'>
            Play/Pause
            </button>
          </div>
          ${exports.midifiles.map(f => /*html*/ `           
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
                            .map((msg) => /* html */ `
          <button msg='${msg}'>${msg}</button>
          `)
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
                        if (p2 === "js")
                            return fsr_1.queryFs(req, res);
                        res.writeHead(200, {
                            "Content-Type": "text/HTML",
                            "set-cookie": `who=${who}`,
                        });
                        res.write(header);
                        res.write(css);
                        res.write(beforeMain);
                        res.write(`<iframe src='/excel/${path_1.basename(file)}'></iframe>`); //
                        res.end(end);
                        break;
                    case "js":
                        this.severjsfiles(res, req);
                        break;
                    case "sf":
                        console.log(parts);
                        const [offset, looplength, endloop, pitchratio] = parts[2].split("_").map((n, i) => {
                            if (i < 3)
                                return parseInt(n);
                            else
                                return parseFloat(n);
                        });
                        const ob = Buffer.alloc(48000);
                        //@ts-ignore
                        resolvebuffer_1.memcopy({ offset, endloop, pitchratio, looplength }, ob, 24000);
                        res.end(ob);
                        break;
                    case "excel":
                        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
                        res.setHeader("Content-Disposition", "attachment; filename=Report.xlsx");
                        const wbook = new exceljs_1.Workbook();
                        break;
                    case "rt":
                        res.writeHead(200, {
                            "Access-Control-Allow-Origin": "*",
                            "Content-Type": "text/event-stream",
                            "Cache-Control": "no-cache",
                        });
                        const rc = load_sort_midi_1.convertMidiRealTime(file);
                        ["note", "#meta", "#time", "#tempo"].map((event) => {
                            rc.emitter.on(event, (d) => {
                                res.write(["event: ", event, "\n", "data: ", JSON.stringify(d), "\n\n"].join(""));
                            });
                        });
                        break;
                    case "pcm":
                        if (req.method === "POST") {
                            this.playbackUpdate(req, session, res);
                        }
                        else {
                            this.playback(res, session, who, file);
                        }
                        break;
                    case "samples":
                        sound_font_samples_1.handleSamples(session, res);
                        break;
                    case "notes":
                        this.sampleNote(p2, p3, res);
                        break;
                    case "dbfs": //fallthrough
                    case "upload":
                        if (req.method === "POST")
                            return fsr_1.handlePost(req, res, session.who);
                        break;
                    case "proxy":
                        const remoteUrl = `https://grep32bit.blob.core.windows.net/pcm/${path_1.basename(req.url)}`; // //'pcm/14v16.pc'
                        res.writeHead(200, {
                            "Access-Control-Allow-Origin": "*",
                            "content-type": "audio/wav",
                        });
                        cspawn_1.cspawn(`ffmpeg ${ffmpeg_templates_1.stdformat} -i ${remoteUrl} -f WAV -`).stdout.pipe(res);
                        break;
                    default:
                        if (req.method === "POST")
                            fsr_1.handlePost(req, res, session.who);
                        else
                            fsr_1.queryFs(req, res) || res.writeHead(404);
                        break;
                }
            }
            catch (e) {
                res.statusCode = 500;
                res.end(e.message);
            }
        };
        this.wshand = (req, _socket) => {
            grep_wss_1.shakeHand(_socket, req.headers);
            const activeSession = this.idUser(req);
            const wsSocket = new grep_wss_1.WsSocket(_socket, req);
            activeSession.wsRef = wsSocket.webSocketKey;
            this.wsRefs[wsSocket.webSocketKey] = wsSocket;
            wsSocket.send("welcome");
            _socket.on("data", function (d) {
                const msg = decoder_1.decodeWsMessage(d);
                wsSocket.emit("data", msg);
                activeSession.player.msg(msg.toString(), wsSocket);
                wsSocket.write(`ack ${msg}`);
            });
        };
        process.env.port = port;
        const fssd = fileserver_1.fileserver();
        this.indexPageParts = HTML_1.hotreloadOrPreload();
        this.server = https_1.createServer(tls, (req, res) => {
            console.log(req.url);
            if (req.url.startsWith("/fs")) {
                return fssd(req, res);
            }
            else
                return this.handler(req, res);
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
    currentSession({ who, parts, query }) {
        return (this.activeSessions[`${who}`] = {
            t: new Date(),
            player: new xplayer_1.Player(),
            who,
            ...this.activeSessions[`${who}`],
            parts,
            query,
        });
    }
    severjsfiles(res, req) {
        res.writeHead(200, {
            "Content-Type": "application/javascript",
        });
        if (path_1.basename(req.url) === "ws-worker.js") {
            const str = fs_1.readFileSync("./js/build/ws-worker.js")
                .toString()
                .replace("%WSHOST%", `wss://${this.host}:${process.env.port}`);
            res.end(str);
        }
        else {
            fs_1.createReadStream(`./js/build/${path_1.basename(req.url)}`).pipe(res);
        }
    }
    sampleNote(p2, p3, res) {
        if (!fs_1.existsSync(`./midisf/${p2}/${p3}.pcm`))
            res.writeHead(404);
        res.writeHead(200, { "Content-Type": "audio/raw" });
        const filename = `./midisf/${p2}/${p3}.pcm`;
        cspawn_1.cspawn(`ffmpeg
            -f f32le -ar 48000 -ac 1 -i ${filename} -af volume=0.5 -f f32le -ac 2 -ar 48000 -`).stdout.pipe(res);
    }
    playback(res, session, who, file) {
        res.writeHead(200, {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "audio/raw",
            "Cache-Control": "no-cache",
            "Content-Disposition": "in-line",
            "x-bit-depth": 32,
            "x-sample-rate": 48000,
            "x-nchannel": 2,
        });
        if (session.player && session.player.output)
            session.player.output = null; // session.rc.stop();
        this.activeSessions[who].player.playTrack(file, res);
        this.activeSessions[who].rc = this.activeSessions[who].player.nowPlaying;
    }
    playbackUpdate(req, session, res) {
        req.on("data", (d) => {
            const [cmd, ...args] = d.toString().split(",");
            switch (cmd) {
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
    idUser(req) {
        const [parts, query] = fsr_1.parseQuery(req);
        const cookies = fsr_1.parseCookies(req);
        const who = cookies["who"] || query["cookie"] || `${process.hrtime()[0]}`;
        this.activeSessions[who] = {
            t: new Date(),
            player: new xplayer_1.Player(),
            who,
            ...this.activeSessions[who],
            parts,
            query,
        };
        return this.activeSessions[who];
    }
}
exports.Server = Server;
if (require.main === module && process.argv[3] === "yisheng") {
    new Server(process.argv[2] || process.env.PORT, process.env.HOST).start();
}
process.on("uncaughtException", (e) => {
    console.log("f ", e);
});
