import {
  existsSync,
  statSync,
  readdirSync,
  open,
  createReadStream,
  mkdirSync,
  readFileSync,
} from "fs";
import { resolve, basename, extname, dirname } from "path";
import { lookup } from "mime-types";
import { IncomingHttpHeaders, IncomingMessage, ServerResponse } from "http";
import { cspawn, resjson } from "./utils";
import { SessionContext } from "./httpd";
import { ServerHttp2Stream } from "http2";
import { Readable } from "stream";
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
const resolvePath = (root, relativePath) => {
  let rt = root.split("/");
  let t = relativePath.split("/");
  while (t.length) {
    rt.push(t.shift());
    mkfolder(rt.join("/"));
  }
  return rt.join("/");
};

export const handlePost = (
  req: IncomingMessage,
  res: ServerResponse,
  session: SessionContext
) => {
  let parts = (req.url[0] || "").split("/");

  const URL = require("url").parse(req.url);
  const fullpadth =
    resolvePath(dbfsroot, session.who + "/" + dirname(URL.pathname)) +
    "/" +
    basename(URL.pathname);

  req.pipe(require("fs").createReadStream(fullpadth));
  res.writeHead(200, "welcome", {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "text/plain; charset=utf-8",
    "Content-Location": dbfsroot + "/" + session.who + "/" + URL.pathname,
  });
  req.on("end", () => {
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
export const queryFs = (req, res) => {
  return queryFsUrl(req.url, res);
};

export const queryFsUrl = (url: string, res) => {
  if (url === "") return false;
  const [parts, query] = parseUrl(url);
  const filename = resolve(__dirname, "..", parts.slice(1).join("/"));
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
        res.end(
          `<html>
          <body>
          <div style='display:grid;grid-template-columns:1fr 3fr'>
          <div>
        <pre>
        ${readdirSync(filename)
          .map((f) => {
            if (statSync(resolve(filename, f)).isDirectory()) {
              return `<a href='${url}/${f}'>${f}</a>`;
            } else if (f.endsWith(".pcm") || f.endsWith(".wav")) {
              return ` <a href='${url}/${f}'>${f}</a>`;
            } else {
              return `<a href='#' preview='${url}/${f}'>${f}</a>`;
            }
          })
          .join("\n")}</pre></div>
        <div>  <form method='post' action='${dbfsroot}/${parts
            .slice(1)
            .join("/")}/newfile${process.hrtime[1]}.txt'>
        <textarea name='body' rows=30 cols=90></textarea>
        <input type='submit' />
        </form></div>
        </div>
          
          <script>` +
            /* javascript */ `
          window.onmousedown=(e)=>{
            if(e.target.hasAttribute("preview")){
              const url = e.target.getAttribute("preview");
              fetch(url).then(async res=>{
                const reader=res.body.pipeThrough(new TextDecoderStream()).getReader()
                const textarea=document.querySelector('textarea');
                textarea.value='';
                while(true){
                  const {value,done} = await reader.read();
                  if(done)break;
                  textarea.value +=value.toString();
                }
              }).catch(e=>{
                document.body.innerHTML+=e.message;
              })
           
            }
          }
          </script></body></html>`
        );
      }
    }
    return true;
  }
  return false;
};

export function hotreloadOrPreload() {
  let idx = readFileSync("./index.html").toString();
  let idx1 = idx.split("<style></style>")[0];
  let idx2 = idx.substr(idx1.length).split("</body>")[0];
  let idx3 = "</body></html>";
  let css = "<style>" + readFileSync("./style.css").toString() + "</style>";
  return [idx, idx1, idx2, idx3, css];
}

type FD = number;
export function pushFile({
  stream,
  file,
  path,
}: {
  stream: ServerHttp2Stream;
  file: string | FD | Buffer | ReadableStream;
  path: string;
}) {
  stream.pushStream({ ":path": path }, (err, pushStream, headers) => {
    if (err) throw err;
    headers = {
      "content-type": lookup(basename(path)),
      ":status": 200,
    };
    switch (typeof file) {
      case "number":
        pushStream.respondWithFD(file, headers);
        break;
      case "string":
        open(resolve(file), "r", (err, fd) => {
          if (err) throw err;
          pushStream.respondWithFD(fd, headers);
        });
        break;
      case "object":
        if (file instanceof Buffer) {
          pushStream.respond(headers);
          pushStream.end(file);
        } else if (file instanceof Readable) {
          pushStream.respond(headers);
          file.pipe(pushStream);
        }
        break;
      default:
        throw "dont know how to handle " + file;
    }
  });
}
