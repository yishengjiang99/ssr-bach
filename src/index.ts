import { convertMidi } from "./load-sort-midi";
import { resolve } from "path"; //   output: process.stdout,
import {
  existsSync,
  createWriteStream,
  createReadStream,
  readdirSync,
  write,
} from "fs";

const httpd = require("http").createServer((req, res) => {
  console.log(req.url);
  switch (req.url) {
    case "/bach":
      res.writeHead(200, {
        "Content-Type": "csv/midi",
        "Content-Disposition": "inline",
      });
      const file = resolve("./Beethoven-Symphony5-1.mid");
      convertMidi(file, {
        output: res,
        realtime: false,
      }).then(() => res.end());
      break;
    case "/list":
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(readdirSync("./csv")));
      break;
    case "/bach.csv":
      res.writeHead(200, { "Content-Type": "plain/csv" });
      const filename = req.query.name || "song";
      if (existsSync("./csv/" + filename + ".csv")) {
        createReadStream(filename).pipe(res);
      } else {
        convertMidi(file, {
          output: createWriteStream(filename),
          realtime: false,
        }).then(() => {
          createReadStream(filename).pipe(res);
        });
      }
      break;
  }
});
httpd.listen("8081");
