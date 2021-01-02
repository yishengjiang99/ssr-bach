import { produce } from "./sound-sprites";
import { Http2Stream, createSecureServer, ServerHttp2Stream } from "http2";
import { PassThrough } from "stream";
const fs = require("fs");
const server = createSecureServer({
  key: fs.readFileSync("localhost-privkey.pem"),
  cert: fs.readFileSync("localhost-cert.pem"),
});
server.on("error", (err) => console.error(err));

server.on("stream", (stream: ServerHttp2Stream, headers) => {
  // stream is a Duplex
  stream.respond({
    "content-type": "text/html; charset=utf-8",
    ":status": 200,
  });
  stream.write("<html><body><video src='/pcm/song.mid' /></body></html>");

  stream.pushStream(
    { ":path": "/pcm/song.mid" },
    (err, pushStream, headers) => {
      if (err) throw err;

      const pt = new PassThrough();
      pt.on("data", (d) => pt);
      pushStream.respond({ ":status": 200 });
      pushStream.end("some pushed data");
      produce("./midi/song.mid", pt); //.song", pt);
    }
  );
});

server.listen(8443);
