import { resolve, basename } from "path";
import {
  existsSync,
  createReadStream,
  readdirSync,
  readFileSync,
  write,
  createWriteStream,
  openSync,
  writeSync,
  closeSync,
  mkdirSync,
} from "fs";
import { Writable, Transform, PassThrough } from "stream";
import { lookup } from "mime-types";
import { readMidiSSE, readAsCSV } from "./read-midi-sse-csv";
import { WsSocket, WsServer, handleWsRequest } from "grep-wss";
import { createServer } from "https";
import { produce } from "./sound-sprites";
import { spawn, execSync } from "child_process";
import { notelist, renderlist, midifiles, renderListStr } from "./filelist";
import { httpsTLS } from "./tls";
const connbyCookies = new Map<string, string>();
const parseq = (req) => {
  const meparts = req.url.split("?");

  const params = (meparts[1] || "").split("&").reduce((queries, p) => {
    const [k, v] = p.split("=");
    queries[k] = decodeURIComponent(v).split("; ")[0];
    return queries;
  }, {});
  return params;
};
const mkfolder = (folder) => existsSync(folder) || execSync(`mkdir ${folder}`);

const server = createServer(httpsTLS, async (req, res) => {
  const meparts = req.url.split("?");
  const parts = meparts[0].split("/");
  console.log(req.method);
  if (
    req.method === "POST" &&
    parts.shift() === "" &&
    parts.shift() === "stdin"
  ) {
    let i = 0;

    let bss = spawn("base64", ["--decode"]);

    mkfolder("./midisf/" + parts[0]);
    const fnm = "./midisf/" + parts.shift() + "/" + parts.shift();
    bss.stdout.pipe(createWriteStream(fnm));
    req.pipe(bss.stdin);
    console.log("fnm " + fnm);

    // bss.stdout.pipe(
    //   spawn("ffmpeg", [
    //     ..."-y -ar 44100 -i pipe:0 -f f32le -ac 1 -ar 48000 ".split(" "),
    //     parts.shift(),
    //     parts.shift().replace("mp3", "pcm"),
    //     "2>",
    //     "./error.log",
    //   ]).stdin
    // );

    req.on("end", () => {
      res.writeHead(200);
      return res.end("ty");
    });
    return;
  }
  console.log(req.headers.cookie);
  let who = req.headers.cookie ? req.headers.cookie : "usr" + process.hrtime[1];

  const indexHtml = readFileSync(resolve(__dirname, "../index.view.html"));
  const style = readFileSync("./style.css");

  const params = (meparts[1] || "").split("&").reduce((queries, p) => {
    const [k, v] = p.split("=");
    queries[k] = v;
    return queries;
  }, {});
  who = who || params["who"];
  if (parts[1] === "bach") parts.shift();
  const p1 = parts[1];
  const p2 = parts[2] || "";
  const p3 = parts.slice(3).join("/");
  const file =
    (p2 && existsSync("./midi/" + p2) && "./midi/" + p2) || "./midi/song.mid";
  if (
    req.url.length > 4 &&
    existsSync(resolve(__dirname, "..", req.url.substring(1)))
  ) {
    const filename = resolve(__dirname, "..", req.url.substring(1));
    console.log("resp for " + filename);
    res.writeHead(200, {
      ContentType: lookup(basename(filename)),
    });

    return createReadStream(filename).pipe(res);
    //resolve(__dirname, "..", req.url.substring(1))).pipe(res);
  }
  try {
    switch (p1) {
      case "":
        res.writeHead(200, {
          contentType: "text/html",
          "set-cookie": who,
        });
        const js = "";

        const parts = indexHtml.toString().split(/\$\{.*\}/);
        res.write(parts[0]);
        const sections = readdirSync("./midisf");

        res.write(style);
        res.write(parts[1]);

        res.write(parts[2]);
        res.write(js);
        res.end(parts[3]);
        break;

      case "samples":
        res.write(
          `<html><head><style>  ${style}</style><body> <a class='mocha' href="/bach/pcm/song.mid">dot dot dot dash</a>`
        );

        renderlist(res, who);

        res.end(
          `<script type='module' src='https://www.grepawk.com/bach/js/bundle.js'></script> ` +
            "</body></html>"
        );
        break;
      case "js":
        let jsn;
        if (p2 === "node_modules") {
          jsn = resolve(__dirname, "../js/node_modules", p3);
        } else {
          jsn = resolve(__dirname, "../js/build", p2);
        }

        if (!existsSync(jsn)) {
          res.writeHead(404);
          res.end();
        } else {
          res.writeHead(200, {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/javascript", //event-stream",
            "set-cookie": who,
          });
          const tokk = Buffer.from("who");
          createReadStream(jsn)
            .pipe(
              new Transform({
                transform: (chunk, enc, cb) => {
                  let idx = chunk.indexOf(Buffer.from("{who}"));
                  if (idx >= 0) {
                    cb(
                      null,
                      Buffer.concat([
                        chunk.slice(0, idx),
                        Buffer.from(who),
                        chunk.slice(idx + 5),
                      ])
                    );
                    //    cb(null, chunk.slice(idx + 5));
                  } else {
                    cb(null, chunk);
                  }
                },
              })
            )
            .pipe(res);
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
        res.writeHead(200, {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "audio/raw",
          "Cache-Control": "no-cache",
        });

        req.on("data", (d) => {
          console.log(d, who);
        });
        connbyCookies[who] = connbyCookies[who] || {};
        const cc = produce(file, res);
        connbyCookies[who].controller = cc;
        if (connbyCookies[who].wsRef) {
          cc.emitter.on("note", (note) => {
            wsRefs[connbyCookies[who].wsRef].write(
              JSON.stringify({
                link: `/mp3/${note.instrument}/${note.midi - 21}`,
                note: note.name,
              })
            );
          });
        }
        break;
      case "mp3":
        let ffc;
        if (p3.endsWith(".mp3")) {
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
      case "csv":
        res.writeHead(200, {
          "Content-Type": "text/csv",
          "Content-Disposition": `inline; filename="bach.csv"`,
        });
        readAsCSV(file, false).pipe(res);
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
const wsRefs = new Map<string, WsSocket>();
handleWsRequest(server, (uri: string) => {
  console.log(uri);
  return handlePCM;
});

const handlePCM = (ws: WsSocket, req) => {
  wsRefs[ws.webSocketKey] = ws;

  const who = parseq(req)["cookie"];
  connbyCookies[who] = connbyCookies[who] || {};
  const guest = connbyCookies[who];
  guest.wsRef = ws.webSocketKey;

  ws.send("welcome");
  ws.on("data", (d) => {
    try {
      handleMessage(d, guest.controller);
    } catch (e) {
      ws.send(e.message);
    }
  });
  function handleMessage(d, controller) {
    const t = d.toString().split(" ");

    switch (t.shift()) {
      case "play":
        const fn = basename(t[0]);
        const file = resolve("midi", basename(t[0]));
        if (!existsSync(file)) {
          ws.send("404");
          return;
        }

        ws.send("starting " + "midi/" + file);

        break;
      case "stop":
        controller.stop();
        break;
      default:
        ws.send("que?");
    }
  }
};
server.listen(443);
process.on("uncaughtException", (e) => {
  console.log("fuck ryan dahl", e);
});
process.stdin.on("data", (d) => {
  const cmd = d.toString().trim();
  cmd === "r" &&
    process.stdout.write(Buffer.from(JSON.stringify(connbyCookies)));
  wsRefs[cmd] && wsRefs[cmd].write("HI");

  cmd === "p" && Object.values(connbyCookies)[0].controller.pause();
});
