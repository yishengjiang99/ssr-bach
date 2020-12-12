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
import { Transform } from "stream";
import { execSync } from "child_process";
const indexHtml = readFileSync(resolve(__dirname, "../index.html"));
const httpd = require("http").createServer(async (req, res) => {
  // const url = require("url").parse(req.url);
  // let start = url.searchParams.get("t") || 0; //length
  // let to = url.searchParams.get("to") || 30;
  const file = resolve(__dirname, "../Beethoven-Symphony5-1.mid");

  const [comma, rm, eventstr, datastr] = [",", "\n", "event: ", "data: "];
  switch (req.url) {
    case "/":
      res.end(indexHtml);
      break;
    case "/rt":
      const tx = new Transform({
        transform: (chunk, _, cb) => {
          const event = chunk.slice(0, chunk.indexOf(comma));
          const data = chunk.slice(event.byteLength + 1);
          cb(null, [eventstr, event, rm, datastr, data, rm, rm].join(""));
        },
      });
      tx.pipe(res);
      res.writeHead(200, {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "text/event-stream",
        Connection: "keep-alive",
        "Cache-Control": "no-cache",
      });

      convertMidi(
        file,
        {
          output: tx,
          realtime: true,
        },
        () => {
          res.end();
        }
      );
      break;
    case "/list":
      res.writeHead(200, { "Content-Type": "application/json" });

      res.end(JSON.stringify(execSync("ls midi/*").toString()));
      break;
    case "/note":

    case "/csv":
      res.writeHead(200, {
        "Content-Type": "text/csv",
        "Content-Disposition": `inline; filename="bach.csv"`,
      });
      convertMidi(
        file,
        {
          output: res,
          realtime: false,
        },
        () => {
          res.end();
        }
      );
      break;
    case "/html":
      res.write(`<html><body><pre>`);
      const csvname = "./csv/" + (req.query.name || "song") + ".csv";
      if (!existsSync(csvname)) {
        await convertMidi(file, {
          output: createWriteStream(csvname),
          realtime: false,
        });
      }
      const rs = createReadStream(csvname);
      rs.pipe(res, { end: false });
      rs.on("ended", res.write("</pre></body></html>"));
      break;
    default:
      res.end(req.url);
      break;
  }
});
httpd.listen("8081");

function getBuffer(str: TemplateStringsArray, args: []) {
  //`${Instrument},${Midi},${start},${duration}`;
  //const pcm = `midisf/${format(Instrument)}/${Midi}`;
}

/*
  `clarinet,67,256,116
  string ensemble 1,67,256,116
  string ensemble 1,67,256,116
  string ensemble 1,55,256,116
  string ensemble 1,43,256,116
  string ensemble 1,43,256,116`
  */
