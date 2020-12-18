import { resolve } from "path"; //   output: process.stdout,
import {
  existsSync,
  createWriteStream,
  createReadStream,
  readdirSync,
  readFileSync,
  write,
} from "fs";
import { Writable } from "stream";

import { readMidiSSE, readAsCSV } from "./read-midi-sse-csv";

import { createServer } from "http";

const indexHtml = readFileSync(resolve(__dirname, "../index.html"));
export const rrrun = () =>
  createServer(async (req, res) => {
    const parts = req.url.split("/");
    const p1 = parts[1];
    const p2 = parts[2] || "";
    const p3 = parts[3] || "";
    const file =
      (p2 && existsSync("./midi/" + p2) && "./midi/" + p2) || "./midi/song";
    switch (p1) {
      case "":
        res.end(indexHtml);
        break;
      case "js":
        const jsn = resolve(__dirname, "js/build", p2);
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
      case "samples":
        res.writeHead(200, { contentType: "text/html" });
        res.write("<html><body>");
        notelist(res);
        res.end("</body></html>");
        break;
      case "notes":
        if (!existsSync("./midisf/" + p2 + "/" + p3 + ".pcm"))
          res.writeHead(404);
        res.writeHead(200, { "Content-Type": "audio/raw" });
        createReadStream("./midisf/" + p2 + "/" + p3 + ".pcm").pipe(res);
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
export {};
const notelist = (res: Writable) => {
  const sections = readdirSync("./midisf");

  for (const section of sections) {
    const links = readdirSync("midisf/" + section).filter((n) =>
      n.endsWith(".pcm")
    );
    res.write("<div class='mt-25'></div>");
    res.write(`<div><span>${section}</span>
    ${links.map((n) => {
      const nn = n.replace("48000-mono-f32le-", "").replace(".pcm", "");
      return `<a href="/bach/notes/${section}/${nn}"> ${nn} </a>`;
    })}
    </div>`);
  }
  res.write(`
     <style>
     .mt-25{
       margin-top:25px;
     }
     body{
       background-color:black;
       color:white;
       
     }
     a{
       color:white;
     }
     canvas{
       top:0;left:0;
       z-index:-2;
    position:absolute;
    width:100vw;
    height:100vh;
  }</style>
  <script type='module' src='/bach/js/playsample.js'></script>`);
};
