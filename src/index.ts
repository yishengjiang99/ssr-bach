import { convertMidi } from "./load-sort-midi";
import { resolve } from "path"; //   output: process.stdout,
import {
  existsSync,
  createWriteStream,
  createReadStream,
  readdirSync,
  readFileSync,
  write,
} from "fs";
import { execSync } from "child_process";
import { readAsCSV } from "./readMidiCSV";
import { readMidiSSE } from "./readMidiSSE";
import { notelist } from "./list";

const filelist = JSON.stringify(execSync("ls midi/*").toString());

const indexHtml = readFileSync(resolve(__dirname, "../index.html"));
const httpd = require("http").createServer(async (req, res) => {
  const parts = req.url.split("/");
  const p1 = parts[1];
  const p2 = parts[2] || "";
  const p3 = parts[3] || "";
  const file = (existsSync("./midi/" + p2) && "./midi/p2") || "./midi/song";
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
      readMidiSSE(file, true).pipe(res);
      break;
    case "samples":
      res.writeHead(200, { contentType: "text/html" });
      res.write("<html><body>");
      notelist(res);
      res.end("</body></html>");
      break;
    case "notes":
      if (!existsSync("./midisf/" + p2 + "/" + p3 + ".pcm")) res.writeHead(404);
      res.writeHead(200, { "Content-Type": "audio/raw" });
      createReadStream("./midisf/" + p2 + "/" + p3 + ".pcm").pipe(res);
      break;
    case "list":
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(execSync("ls midi/*").toString()));
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
});
httpd.listen("8081");
