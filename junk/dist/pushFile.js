"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pushFile = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const mime_types_1 = require("mime-types");
const stream_1 = require("stream");
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
