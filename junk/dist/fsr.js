"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pushFile = exports.queryFs = exports.parseCookies = exports.handlePost = exports.resolvePath = exports.mkfolder = exports.parseUrl = exports.parseQuery = exports.dbfsroot = void 0;
/* eslint-disable no-console */
const fs_1 = require("fs");
const path_1 = require("path");
const mime_types_1 = require("mime-types");
const stream_1 = require("stream");
exports.dbfsroot = path_1.resolve(__dirname, "../dbfs");
const parseQuery = (req) => exports.parseUrl(req.url);
exports.parseQuery = parseQuery;
const parseUrl = (url) => {
    const meparts = url.split("?");
    const parts = meparts[0].split("/");
    const query = (meparts[1] || "").split("&").reduce((queries, p) => {
        const [k, v] = p.split("=");
        queries.set(k, decodeURIComponent(v).split("; ")[0]);
        return queries;
    }, new Map());
    return [parts, query];
};
exports.parseUrl = parseUrl;
const mkfolder = (folder) => fs_1.existsSync(folder) || fs_1.mkdirSync(folder);
exports.mkfolder = mkfolder;
const resolvePath = (root, relativePath) => {
    const rt = root.split("/");
    const t = relativePath.split("/");
    while (t.length) {
        rt.push(t.shift());
        exports.mkfolder(rt.join("/"));
    }
    return rt.join("/");
};
exports.resolvePath = resolvePath;
const handlePost = (req, res, who) => {
    const url = req.url.slice(0);
    const folder = exports.resolvePath(exports.dbfsroot, who + path_1.dirname(url));
    const fullpath = path_1.resolve(folder, path_1.basename(url));
    fs_1.open(fullpath, "a+", (err, fd) => {
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
            fs_1.write(fd, d, 0, d.byteLength, offset, (err, written, buf) => {
                if (err)
                    console.error(err);
                if (res.writableEnded === false)
                    res.write(`\n${written}written`);
            });
            offset += d.byteLength;
        });
        req.on("end", () => {
            fs_1.closeSync(fd);
            res.end();
        });
    });
    const pq = fs_1.createReadStream(fullpath);
    pq.on("data", (d) => {
        res.write(d);
    });
};
exports.handlePost = handlePost;
function parseCookies(request) {
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
exports.parseCookies = parseCookies;
const queryFs = (req, res, baseName = '') => {
    if (req.url === "")
        return false;
    const url = req.url;
    const [parts, query] = exports.parseUrl(req.url);
    const filename = path_1.resolve(__dirname, "..", baseName, parts.slice(1).join("/"));
    if (!fs_1.existsSync(filename)) {
        return false;
    }
    if (fs_1.statSync(filename).isFile()) {
        res.writeHead(200, {
            "Content-Type": require("mime-types").lookup(filename),
            "Access-Control-Allow-Origin": "*",
        });
        return fs_1.createReadStream(filename).pipe(res);
    }
    else {
        const mkLink = (filename, f) => {
            if (fs_1.statSync(path_1.resolve(filename, f)).isDirectory()) {
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
exports.queryFs = queryFs;
function pushFile({ stream, file, path, }) {
    stream.pushStream({ ":path": path }, (err, pushStream, headers) => {
        if (err)
            throw err;
        headers = {
            "content-type": mime_types_1.lookup(path_1.basename(path)),
            ":status": 200,
        };
        switch (typeof file) {
            case "number":
                pushStream.respondWithFD(file, headers);
                break;
            case "string":
                fs_1.open(path_1.resolve(file), "r", (err, fd) => {
                    if (err)
                        throw err;
                    pushStream.respondWithFD(fd, headers);
                });
                break;
            case "object":
                if (file instanceof Buffer) {
                    pushStream.respond(headers);
                    pushStream.end(file);
                }
                else if (file instanceof stream_1.Readable) {
                    pushStream.respond(headers);
                    file.pipe(pushStream);
                }
                break;
            default:
                throw `dont know how to handle ${file}`;
        }
    });
}
exports.pushFile = pushFile;
