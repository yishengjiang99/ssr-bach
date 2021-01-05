import { produce } from "./sound-sprites";
import { Http2Stream, createSecureServer, ServerHttp2Stream } from "http2";
import { PassThrough } from "stream";
import { readFileSync } from "fs";
import { mp3c } from "./sinks";
import { resolve } from "path";
import { cspawn } from "./utils";
import { parseQuery, parseUrl } from "./fsr";
import { existsSync } from "fs";
import { get } from "https";
const fs = require("fs");
const server = createSecureServer({
  key: readFileSync("/etc/letsencrypt/live/www.grepawk.com-0001/privkey.pem"),
  cert: readFileSync(`/etc/letsencrypt/live/www.grepawk.com-0001/fullchain.pem`),
});
server.on("error", (err) => console.error(err));

server.on("stream", (stream: ServerHttp2Stream, headers) => {
  const [parts, query] = parseUrl(headers[":path"]);
  const [_, p1, p2, p3] = parts;
  const file =
    parts[1] !== "" && existsSync("midi/" + decodeURIComponent(parts[1]))
      ? "midi/" + decodeURIComponent(parts[1])
      : "midi/song.mid";
  // stream is a Duplex
  stream.respond({
    "content-type": "text/html; charset=utf-8",
    ":status": 200,
  });
  stream.write(/* html */ `<html>
    <head><style>
      body{text-align:center}

    </style>
    <body><h1>${file}</h1>
    <div>
      <audio controls=true src='/bach.mp3' ></audio>
    </div>
    <input type='range' name='post-vol' min='0' max='2' value='1'/>
    <script src='/play.js'></script>`);

  const rc2 = new PassThrough();
  stream.pushStream({ ":path": "/bach.mp3" }, (err, pushStream, headers) => {
    if (err) throw err;
    const proc = cspawn("ffmpeg -re -f f32le -ac 2 -ar 48000 -i pipe:0 -f WAV -", {
      debug: true,
    });
    // produce(resolve(__dirname, "../midi/song.mid"), proc.stdin, rc2);
    // const curl = cspawn(
    //   `curl -S https://grep32bit.blob.core.windows.net/pcm/billicrown.pcm -o -`,
    //   { debug: true }
    // );
    get("https://grep32bit.blob.core.windows.net/pcm/billicrown.pcm", (res) => {
      console.log(res);
      res.on("data", (d) => {
        proc.stdin.write(d);
      });
    });

    pushStream.respond({ ":status": 200, contentType: "audio/wav" });
    proc.stdout.pipe(pushStream);
  });
  stream.pushStream({ ":path": "/play.js" }, (err, pushStream, headers) => {
    pushStream.respond({ ":status": 200, contentType: "application/javascript" });

    pushStream.end(
      Buffer.from(/*  javascript */ ` 
    const {readable, writable} = new TransformStream();
    const sliders = document.querySelectors("input[type=range]");
    sliders[0].oninput = (e)=> writable.write(e.target.id+": "+e.target.value);
    (async function _(){
      fetch("/comms",{ method:"POST", body:readable});
    })()`)
    );
  });
});

server.listen(8443);
