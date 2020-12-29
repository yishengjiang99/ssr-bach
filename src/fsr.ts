import { existsSync, statSync, createReadStream, mkdirSync } from "fs";
import { resolve, basename } from "path";
import { lookup } from "mime-types";
import { IncomingHttpHeaders, IncomingMessage, ServerResponse } from "http";
import { cspawn } from "./utils";

export const parseQuery = (
  req: IncomingMessage
): [string[], Map<string, string>] => {
  const meparts = req.url.split("?");
  const parts = meparts[0].split("/");
  const query = (meparts[1] || "").split("&").reduce((queries, p) => {
    const [k, v] = p.split("=");
    queries[k] = decodeURIComponent(v).split("; ")[0];
    return queries;
  }, new Map<string, string>());
  return [parts, query];
};
const mkfolder = (folder) => existsSync(folder) || mkdirSync(folder);

export const handlePost = (req: IncomingMessage, res: ServerResponse) => {
  if (req.method === "POST") {
    let parts = (req.url[0] || "").split("/");
    let i = 0;

    let bss = cspawn("base64 --decode");
    mkfolder("./midisf/" + parts[0]);
    const fnm = "./midisf/" + parts.shift() + "/" + parts.shift();
    bss.stdout.pipe(require("fs").createReadStream(fnm));
    req.pipe(bss.stdin);

    req.on("end", () => {
      res.writeHead(200);
      return res.end("ty");
    });
  }
};

export function parseCookies(request) {
  var list = {},
    rc = request.headers.cookie;
  rc &&
    rc.split(";").forEach(function (cookie) {
      var parts = cookie.split("=");
      list[parts.shift().trim()] = decodeURI(parts.join("="));
    });
  return list;
}
export const queryFs = (req: IncomingMessage, res) => {
  let filename = resolve(__dirname, "..", req.url.substring(1));
  if (statSync(filename).isDirectory()) {
    filename = resolve(filename, "index.js");
  }
  if (existsSync(filename)) {
    res.writeHead(200, {
      ContentType: lookup(basename(filename)) as string,
    });
    return createReadStream(filename).pipe(res);
  }
};
