"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mp3c = exports.devnull = exports.nc80 = exports.tmpOutput = exports.ffp = exports.lowpassFilter = void 0;
const child_process_1 = require("child_process");
const stream_1 = require("stream");
const cspawn_1 = require("./cspawn");
const fs_1 = require("fs");
const lowpassFilter = (cutoff) => {
    const { stdin, stdout } = cspawn_1.cspawn(`ffmpeg -i pipe:0 -filter:a lowpass=f=${cutoff} -`);
    return { stdin, stdout };
};
exports.lowpassFilter = lowpassFilter;
const ffp = (props) => {
    const { ar, ac, format } = props || {};
    const { stdin, stderr, stdout } = child_process_1.spawn("ffplay", [
        "-i",
        "pipe:0",
        "-ac",
        `${ac || "2"} `,
        "-f",
        `${format || "f32le"}`,
        "-ar",
        `${ar || "48k"} `,
    ]);
    stderr.pipe(process.stderr);
    stdout.pipe(process.stderr);
    return stdin;
};
exports.ffp = ffp;
const tmpOutput = () => {
    return fs_1.createWriteStream(child_process_1.execSync("mktemp -u").toString());
};
exports.tmpOutput = tmpOutput;
const nc80 = (port) => {
    return cspawn_1.cspawn(`nc -l ${port}`).stdin;
};
exports.nc80 = nc80;
const devnull = () => {
    return new stream_1.PassThrough();
};
exports.devnull = devnull;
const mp3c = () => {
    const { stdin, stderr, stdout } = child_process_1.spawn("ffmpeg", [
        "-loglevel",
        "debug",
        "-i",
        "pipe:0",
        "-ac",
        "2",
        "-f",
        "f32le",
        "-ar",
        "48000",
        "-acodec",
        "copy",
        "-",
    ]);
    stderr.pipe(process.stderr);
    return [stdin, stdout, stderr];
};
exports.mp3c = mp3c;
