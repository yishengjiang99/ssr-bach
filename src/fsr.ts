/* eslint-disable no-console */
import {
  existsSync,
  statSync,
  readdirSync,
  open,
  createReadStream,
  mkdirSync,
  readFileSync,
  write,
  closeSync,
} from "fs";
import { resolve, basename, dirname } from "path";
import { lookup } from "mime-types";
import { IncomingMessage, ServerResponse } from "http";
import { ServerHttp2Stream } from "http2";
import { Readable } from "stream";
import { resjson } from "./utils";

export const dbfsroot = resolve(__dirname, "../dbfs");
export const parseQuery = (req: IncomingMessage): [string[], Map<string, string>] =>
  parseUrl(req.url);
export const parseUrl = (url: string): [string[], Map<string, string>] => {
  const meparts = url.split("?");
  const parts = meparts[0].split("/");
  const query = (meparts[1] || "").split("&").reduce((queries, p) => {
    const [k, v] = p.split("=");
    queries.set(k, decodeURIComponent(v).split("; ")[0]);
    return queries;
  }, new Map<string, string>());
  return [parts, query];
};
export const mkfolder = (folder) => existsSync(folder) || mkdirSync(folder);
export const resolvePath = (root, relativePath) => {
  const rt = root.split("/");
  const t = relativePath.split("/");

  while (t.length) {
    rt.push(t.shift());
    mkfolder(rt.join("/"));
  }
  return rt.join("/");
};

export const handlePost = (req: IncomingMessage, res: ServerResponse, who?: string) => {
  const url = req.url.slice(0);
  const folder = resolvePath(dbfsroot, who + dirname(url));
  const fullpath = resolve(folder, basename(url));
  open(fullpath, "a+", (err, fd) => {
    if (err) {
      res.writeHead(500);
      res.end(err.message);
    }
    res.writeHead(200, "welcome", {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "text/plain; charset=utf-8",
    });
    let offset = 0;

    req.on("data", (d) => {
      write(fd, d, 0, d.byteLength, offset, (err, written, buf) => {
        if (err) console.error(err);
        if (res.writableEnded === false) res.write(`\n${written}written`);
      });
      offset += d.byteLength;
    });
    req.on("end", () => {
      closeSync(fd);
      res.end();
    });
  });

  const pq = createReadStream(fullpath);
  pq.on("data", (d: Buffer) => {
    res.write(d);
  });
};

export function parseCookies(request) {
  const list = {};
  const rc = request.headers.cookie;
  if (rc) {
    rc.split(";").forEach((cookie) => {
      const parts = cookie.split("=");
      list[parts.shift().trim()] = decodeURI(parts.join("="));
    });
  }
  return list;
}

export const queryFsUrl = (url: string, res): any => {
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
    }
    if (query.format === "json") {
      resjson(res, readdirSync(filename));
      res.end();
    } else {
      const mkLink = (filename, f) => {
        if (statSync(resolve(filename, f)).isDirectory()) {
          return `<a href='${url}/${f}'>${f}</a>`;
        }
        if (f.endsWith(".pcm") || f.endsWith(".wav")) {
          return ` <a href='${url}/${f}'>${f}</a>`;
        }
        if (f.endsWith(".mp4") || f.endsWith(".webm")) {
          return ` <a href='#' video='${url}/${f}'>${f}</a>`;
        }
        return `<a href='#' preview='${url}/${f}'>${f}</a>`;
      };
      res.end(/* html */ `
      <html>
          <body>
          <div style='display:grid;grid-template-columns:1fr 3fr'>
          <div>
        <pre>
        ${readdirSync(filename)
          .map((f) => mkLink(filename, f))
          .join("\n")}
        </pre></div>
        <div>  <form method='post' action='/${parts
          .slice(1)
          .join("/")}/newfile${Math.random()}.txt'>
        <textarea name='body' rows=30 cols=90></textarea>
        <input type='submit' />
        </form></div>
        </div>
          <script>window.onmousedown=(e)=>{
              if(e.target.hasAttribute("video")){
                  const pl=document.createElement("video");
                pl.src=e.target.getAttribute("video");
                document.body.append(pl);
              }else  if(e.target.hasAttribute("preview")){
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
          }</script></body></html>`);
    }

    return true;
  }
  return false;
};
export const queryFs = (req, res) => {
  console.log(req.url);
  return queryFsUrl(req.url, res);
};

export const hotreloadOrPreload = (url = "./index.html") => {
  const idx = readFileSync(url).toString();
  const idx1 = idx.split("<style></style>")[0];
  const beforeMain = `${idx.substr(idx1.length).split("<main></main>")[0]}<main>`;
  const idx2 = idx.substr(idx1.length + beforeMain.length).split("</body>")[0];
  const idx3 = "</body></html>";
  const css = `<style>${readFileSync("./style.css").toString()}</style>`;
  return [idx, idx1, beforeMain, idx2, idx3, css];
};
type FD = number;
export function pushFile({
  stream,
  file,
  path,
}: {
  stream: ServerHttp2Stream;
  file: string | FD | Buffer | ReadableStream;
  path: string;
}): void {
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
        throw `dont know how to handle ${file}`;
    }
  });
}
