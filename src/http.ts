import { resolve } from "path";
import {
  existsSync,
  createReadStream,
  readdirSync,
  readFileSync,
  write,
} from "fs";
import { Writable } from "stream";

import { readMidiSSE, readAsCSV } from "./read-midi-sse-csv";

import { createServer } from "http";
import { produce } from "./sound-sprites";
import { spawn } from "child_process";
import { notelist } from "./list";
export const indexHtml = readFileSync(resolve(__dirname, "../index.html"));
export const rrrun = () => {
  createServer(async (req, res) => {
    const parts = req.url.split("/");
    const p1 = parts[1];
    const p2 = parts[2] || "";
    const p3 = parts.slice(3).join("/");
    const file =
      (p2 && existsSync("./midi/" + p2) && "./midi/" + p2) || "./midi/song";
    switch (p1) {
      case "":
        res.writeHead(200, { contentType: "text/html" });
        res.write(
          `<!doctype html><html><head><style> ${style}</style><body>
            <div id='header' class='mt-125'> <a class='mocha' href='/bach/pcm'>dot dot dot dash</a></div>
            <script type='module' src='https://grep32bit.blob.core.windows.net/pcm/playsample.js?v=33'></script> `
        );
        res.end("</body></html>");
        break;

      case "samples":
        res.write("<html><head><style>  " + style + "</style><body>");
        notelist(res);

        res.end(
          "</div><script type='module' src='https://grep32bit.blob.core.windows.net/pcm/playsample.js?v=33'></script></body></html>"
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
        produce(file, res, null, "auto");
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
  }).listen(8081);

  const style = `
  .samples{
    display:none
  }.mt-125{
  margin-top:215px;
  padding-bottom:215px;

  align-content:center;
  text-align:center
}
body{
  background-color:black;
  color:white;
  font-size:1.1em;
  
}
.playing {
  color:rgba(13,13,13,.4);
}
.playing a{
  color:rgba(13,13,13,.4);

}
a{
  color:white;
}
canvas{
  top:0;left:0;
  z-index:-2;
position:absolute;
width:100vw;
height:100vh;}`;
};
