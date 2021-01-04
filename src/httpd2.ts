import { produce } from "./sound-sprites";
import { Http2Stream, createSecureServer, ServerHttp2Stream } from "http2";
import { PassThrough } from "stream";
import { readFileSync } from "fs";
import { mp3c } from "./sinks";
import { resolve } from "path";
import { cspawn } from "./utils";
const fs = require("fs");
const server = createSecureServer({
  key: readFileSync("/etc/letsencrypt/live/www.grepawk.com-0001/privkey.pem"),
  cert: readFileSync(`/etc/letsencrypt/live/www.grepawk.com-0001/fullchain.pem`),
});
server.on("error", (err) => console.error(err));

server.on("stream", (stream: ServerHttp2Stream, headers) => {
  // stream is a Duplex
  stream.respond({
    "content-type": "text/html; charset=utf-8",
    ":status": 200,
  });
  stream.write(
    `<html><body><audio controls=true src='/bach.mp3' /></audio></body></html>`
  );

  const rc2 = new PassThrough();
  stream.pushStream({ ":path": "/bach.mp3" }, (err, pushStream, headers) => {
    if (err) throw err;
    const proc = cspawn("ffmpeg -re -f f32le -ac 2 -ar 48000 -i pipe:0 -f WAV -");
    produce(resolve(__dirname, "../midi/song.mid"), proc.stdin, rc2);

    pushStream.respond({ ":status": 200, contentType: "audio/wav" });
    proc.stdout.pipe(pushStream);
  });
});

server.listen(8443);
