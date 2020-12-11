import { resolve } from "path";
import { readdirSync, createReadStream } from "fs";
import { convertMidi } from "./load-sort-midi";

const app = require("express")();
const httpd = require("http").createServer((req, res) => {
  console.log(req.url);
  switch (req.url) {
    case "/bach":
      res.end(`<!DOCTYPE html>
		<html>
		<head><link rel="icon" 
		href="https://www.grepawk.com/favicon.ico?t=${process.hrtime().join(",")}">
			<meta charset="utf-8" />
			<meta name="viewport" content="width=device-width, initial-scale=1" />
			<meta name="description" content="Starter Snowpack App" />
			<style>
			body {
			  padding: 0;
			  margin: 0;
			  width:100vh;
			  height:100vw;
			  background-color:black;
			  color:white;
			}
			</style>
		  </head>
		  <body>
		  <canvas></canvas>
		  </html>
		`);
      break;
    case "/bach.png":
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
