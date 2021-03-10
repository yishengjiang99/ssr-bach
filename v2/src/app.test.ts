import test, { afterEach } from "ava";
import { get } from "http";
import "./app";
import httpd from "./app";
test("httpd server", (t) => {
  let server;
  afterEach(() => server.close());
  server = httpd(3333);
  t.is(server, 0);

  server.on("listening", () => {
    t.truthy(server);
    let chunk = [];
    const req = get("http://localhost:3333/55");
    req.on("data", (d) => {
      d.push(chunk);
    });
    req.on("done", () => {
      t.is(Buffer.concat(chunk).toString(), "55");
    });
  });
});
