import { createServer } from "http";

createServer((req, res) => {
  const url = require("url").parse(req.url);
  let m = url.query && url.path.match(/\=(\s?)\/(\s?)/);
  console.log(m);
  res.end(url.uri);
}).listen(8083);
