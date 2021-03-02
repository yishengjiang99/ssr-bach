/* eslint-disable no-console */
import {
  existsSync,
  statSync,
  readdirSync,
  open,
  createReadStream,
  mkdirSync,
  write,
  closeSync,
} from "fs";
import { resolve, basename, dirname } from "path";
import { lookup } from "mime-types";
import { IncomingMessage, ServerResponse } from "http";
import { ServerHttp2Stream } from "http2";
import { Readable } from "stream";
import { resjson } from "./utils";
import { application } from "express";

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

export const queryFs = (req, res, baseName = ""): any => {
  if (req.url === "") return false;
  const url = req.url;
  const [parts, query] = parseUrl(req.url);
  const filename = resolve(__dirname, "..", baseName, parts.slice(1).join("/"));
  if (!existsSync(filename)) {
    return false;
  }
  if (statSync(filename).isFile()) {
    res.writeHead(200, {
      "Content-Type": require("mime-types").lookup(filename),
      "Access-Control-Allow-Origin": "*",
    });
    return createReadStream(filename).pipe(res);
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
      return `<a href='${url}/${f}'>${f}</a>`;
    };
    return res.render;
  }
};

type FD = number;
export function pushFile({
  stream,
  file,
  path,
}: {
  stream: ServerHttp2Stream;
  file: string | FD | Buffer | Readable;
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
