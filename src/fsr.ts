import {
  existsSync,
  statSync,
  readdirSync,
  createReadStream,
  mkdirSync,
  readFileSync,
} from "fs";
import { resolve, basename, extname } from "path";
import { lookup } from "mime-types";
import { IncomingHttpHeaders, IncomingMessage, ServerResponse } from "http";
import { cspawn, resjson } from "./utils";
import { SessionContext } from "./httpd";
const dbfsroot = "../dbfs";
export const parseQuery = (req: IncomingMessage): [string[], Map<string, string>] => {
  return parseUrl(req.url);
};
export const parseUrl = (url: string): [string[], Map<string, string>] => {
  const meparts = url.split("?");
  const parts = meparts[0].split("/");
  const query = (meparts[1] || "").split("&").reduce((queries, p) => {
    const [k, v] = p.split("=");
    queries[k] = decodeURIComponent(v).split("; ")[0];
    return queries;
  }, new Map<string, string>());
  return [parts, query];
};
const mkfolder = (folder) => existsSync(folder) || mkdirSync(folder);

export const handlePost = (
  req: IncomingMessage,
  res: ServerResponse,
  session: SessionContext
) => {
  let parts = (req.url[0] || "").split("/");
  const path = resolve(dbfsroot, session.who, basename(req.url));
  mkfolder(path);

  req.pipe(require("fs").createReadStream(path));

  req.on("end", () => {
    res.writeHead(200);
    return res.end("ty");
  });
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
  if (req.url === "") return false;
  const [parts, query] = parseQuery(req);
  const filename = resolve(__dirname, "..", parts.slice(1).join("/"));
  console.log(filename);
  if (existsSync(filename)) {
    if (statSync(filename).isFile()) {
      res.writeHead(200, {
        "Content-Type": require("mime-types").lookup(filename),
        "Access-Control-Allow-Origin": "*",
      });
      return createReadStream(filename).pipe(res);
    } else {
      if (query["format"] === "json") {
        resjson(res, readdirSync(filename));
        res.end();
      } else {
        res.end(`<html><body><pre>
        ${readdirSync(filename).join("\n")}</pre></body></html>`);
      }
    }
    return true;
  }
  return false;
};
