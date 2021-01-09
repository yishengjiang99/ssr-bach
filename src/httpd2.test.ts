import { MemoryWritable } from "grep-transform";
import {
  Http2Server,
  ServerHttp2Stream,
  ServerHttp2Session,
  IncomingHttpHeaders,
} from "http2";
import { cspawn } from "./utils";

const server: Http2Server = require("http2")
  .createSecureServer(require("./tls").httpTLS)
  .on("checkContinue", console.log)
  .on("session", (session: ServerHttp2Session) => {
    console.log("session got");
  })
  .on("sessionError", (err) => console.error)
  .on(
    "stream",
    (stream: ServerHttp2Stream, headers: IncomingHttpHeaders, flags: number) => {
      const method = headers[":method"];
      const path = headers[":path"];
      stream.respond({
        ":status": 200,
        "content-type": "text/plain",
      });
      stream.write("hello ");
      stream.end("world");
    }
  )
  .on(
    "timeout",
    (stream: ServerHttp2Stream, headers: IncomingHttpHeaders, flags: number) => {}
  );
server.listen(3000, process.env.HOST);
// test("connectiviy", () => {
//   cspawn(`curl -I ${process.env.HOST} -o -`).stdout.on('data',d=>d.toString(),

//   new MemoryWritable());
//   console.log
// });
