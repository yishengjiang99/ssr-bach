import { handler } from "./httpd";
import { PassThrough } from "stream";
import { createServer } from "http";
import { request } from "http";

createServer(handler).listen(3222);
request(
  "http://localhost:3222/pcm/song.mid",
  { method: "get", headers: { cookie: "admin" } },
  (err, res) => {
    res.statusCode == 200;
  }
);
