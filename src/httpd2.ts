import { spawn, execSync } from "child_process";
import {
  readFileSync,
  createReadStream,
  readdirSync,
  existsSync,
  openSync,
} from "fs";
import { renderListStr } from "./filelist";

import { basename, extname } from "path";
import { lookup } from "mime-types";
const domain = "media.grepawk.com";
const html = readFileSync("./js/index.html");
export const midifiles = execSync("ls midi/*")
  .toString()
  .trim()
  .split("\n")
  .filter((n) => n);
const mkfolder = (folder) => existsSync(folder) || execSync(`mkdir ${folder}`);

export const fileRow = (item) => {
  return `
  <tr>
  <td>${item.name}</td><td>${item.name}</td>
  <td><a class='mocha' href="/bach/pcm/${item.name}"> read</a>
  <a class='opts' href="/edit/${item.name}"> edit</a>
  </td>
  </tr>`;
};
const files = readdirSync("./js/build").map((f) => ({
  path: f,
  buffer: readFileSync("./js/build/" + f),
}));
const server = require("http2")
  .createSecureServer({
    key: readFileSync(`/etc/letsencrypt/live/${domain}/privkey.pem`),
    cert: readFileSync(`/etc/letsencrypt/live/${domain}/fullchain.pem`),
  })
  .on("stream", (stream, headers) => {
    console.log(headers);
    stream.pushStream({ ":path": "/list" }, (err, pushStream, headers) => {
      if (err) console.error(err);
      pushStream.write(renderListStr("wme"));
    });

    stream.respond({
      ":status": 200,
      "content-type": "text/html",
    });
    files.forEach((f) => {
      console.log("path for ", f.path);
      stream.pushStream(
        { ":path": "/" + basename(f.path) },
        (err, pushStream, headers) => {
          if (err) throw err;

          pushStream.respond({
            ":status": 200,
            "content-type": lookup(extname(f.path)),
          });
          pushStream.end(f.buffer);
        }
      );
    });
    stream.end(readFileSync("./js/index.html"));
  });
server.listen(8443);
// server.on("session", (session) => {
//   // Set altsvc for origin https://example.org:80
//   session.altsvc('h2=":8000"', "https://example.org:80");
// });
