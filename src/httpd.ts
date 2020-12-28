import { resolve, basename } from "path";
import {
  existsSync,
  createReadStream,
  readdirSync,
  readFileSync,
  write,
} from "fs";
import { Writable, Transform, PassThrough } from "stream";
import { lookup } from "mime-types";
import { readMidiSSE, readAsCSV } from "./read-midi-sse-csv";
import { WsSocket, WsServer, handleWsRequest } from "grep-wss";
import { createServer, ServerResponse, IncomingHttpHeaders } from "http";
import { produce } from "./sound-sprites";
import { spawn } from "child_process";
import { notelist, renderlist, midifiles } from "./filelist";

const server = createServer(async (req, res) => {
  const indexHtml = readFileSync(resolve(__dirname, "../index.view.html"));
  const style = readFileSync("./style.css");
  const parts = req.url.split("/");
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
        res.writeHead(200, { contentType: "text/html" });
        const js = readFileSync(
          resolve(__dirname, "../js/bundle.js")
        ).toString();
        console.log(js);
        const parts = indexHtml.toString().split(/\$\{.*\}/);
        res.write(parts[0]);

        res.write(style);
        res.write(parts[1]);
        renderlist(res);
        res.write(parts[2]);
        res.write(js);
        res.end(parts[3]);
        break;

      case "samples":
        res.write("<html><head><style>  " + style + "</style><body>");
        renderlist(res);
        notelist(res);

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
        console.log(jsn);
        if (!existsSync(jsn)) {
          res.writeHead(404);
          res.end();
        } else {
          res.writeHead(200, {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/javascript", //event-stream",
          });
          createReadStream(jsn).pipe(res);
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
        produce(file, res);
        req.on("data", (d) => {
          console.log(d);
        });
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

handleWsRequest(server, (uri: string) => {
  return handlePCM;
});
const handlePCM = (ws: WsSocket, req) => {
  ws.send("welcome");
  ws.on("data", (d) => {
    try {
      handleMessage(d);
    } catch (e) {
      ws.send(e.message);
    }
  });
  function handleMessage(d) {
    const t = d.toString().split(" ");
    let controller;
    switch (t.shift()) {
      case "play":
        const fn = basename(t[0]);
        const file = resolve("midi", basename(t[0]));
        if (!existsSync(file)) {
          ws.send("404");
          return;
        }

        ws.send("starting " + "midi/" + file);
        const pt = new PassThrough();
        controller = produce(file, pt);
        pt.on("data", (d) => ws.write(d));
        break;
      case "stop":
        controller.stop();
        break;
      default:
        ws.send("que?");
    }
  }
};
server.listen(8081);
process.on("uncaughtException", (e) => {
  console.log("fuck ryan dahl", e);
});
