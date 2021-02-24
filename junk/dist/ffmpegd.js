"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ffjmpegd = void 0;
const fs_1 = require("fs");
const stream_1 = require("stream");
const stream_2 = require("stream");
const cspawn_1 = require("./cspawn");
function ffjmpegd({ pitchRatio, inputSampleRate, outputSampleRate }) {
    const pt = new stream_2.PassThrough();
    let buffer = Buffer.alloc(0);
    const addBuffer = (_buffer) => {
        buffer = Buffer.concat([_buffer, buffer]);
    };
    const ffmpegd = cspawn_1.cspawn(`ffmpeg -i pipe:0 -af tempo=${pitchRatio} -`, [
        new stream_1.Readable({
            autoDestroy: false,
            read: (n) => {
                if (buffer.byteLength > n) {
                    const ret = buffer.slice(0, n);
                    buffer = buffer.slice(n);
                    console.log(buffer);
                    return ret;
                }
                else {
                    const ret = Buffer.concat([buffer, Buffer.alloc(n - buffer.byteLength)]);
                    buffer = Buffer.alloc(0);
                    console.log(ret);
                    return ret;
                }
            },
        }),
        pt,
        process.stderr,
    ]);
    const runsample = (sample) => {
        return new Promise((resolve) => {
            let outputCount = (sample.byteLength / inputSampleRate) * outputSampleRate;
            let results = [];
            addBuffer(sample);
            pt.on("data", (d) => {
                console.log(d);
                if (outputCount - d.byteLength > 0) {
                    results.push(d);
                }
                else {
                    results.push(d.slice(0, d.byteLength - outputCount));
                    resolve(Buffer.concat(results));
                }
            });
        });
    };
    return {
        addBuffer,
        output: pt,
        pid: ffmpegd.pid,
        runsample,
    };
}
exports.ffjmpegd = ffjmpegd;
ffjmpegd({
    pitchRatio: 3,
    inputSampleRate: 44800,
    outputSampleRate: 44800,
})
    .runsample(fs_1.readFileSync("./midisf/0-stereo-40.pcm"))
    .then((o) => console.log(o));
