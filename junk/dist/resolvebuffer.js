"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvebuffer = exports.memcopy = exports.findIndex = exports.load = void 0;
const console_1 = require("console");
const fs_1 = require("fs");
const s16tof32_1 = require("./s16tof32");
//@ts-ignore
let csv, filemem, spdastart, sdpa;
function load(filename = './file.sf2') {
    filemem = fs_1.readFileSync(filename);
    spdastart = filemem.indexOf("sdtasmpl"); //pdastart = 
    sdpa = filemem.slice(spdastart);
    console.log(sdpa);
    csv = fs_1.readFileSync("./bitmap.csv")
        .toString()
        .split("\n")
        .reduce((map, line) => {
        const [name, preset, lokey, hikey, lowvel, highvel, offset, end, loop, endloop, samplerate, pitch,] = line.split(",").map((t) => parseInt(t));
        map[preset] = map[preset] || [];
        map[preset].push({
            preset,
            lokey,
            hikey,
            lowvel,
            highvel,
            offset,
            end,
            loop,
            endloop,
            pitch,
            samplerate
        });
        return map;
    }, []);
    return [csv, filemem];
}
exports.load = load;
function findIndex(presetId, midi, velocity) {
    const opts = csv[presetId];
    if (!opts || opts.length < 1) {
        return null;
    }
    let match = null;
    let pitchdiff = 88;
    for (const item of opts) {
        const { lokey, hikey, lowvel, highvel, pitch } = item;
        if (hikey >= midi && lokey <= midi && lowvel <= velocity && highvel >= velocity) {
            match = !match ? item : pitchdiff > parseInt(pitch) - midi ? item : match;
            break;
        }
    }
    if (!match)
        return null;
    const { offset, end, loop, endloop, pitch, samplerate } = match;
    const pitchratio = 1;
    const looplength = endloop - loop;
    console_1.assert(looplength != NaN);
    return { offset, loop, endloop, pitchratio, looplength };
}
exports.findIndex = findIndex;
function memcopy({ offset, endloop, pitchratio, looplength }, output, n) {
    for (let i = offset, j = 0; j < n; j += 2, i += pitchratio) {
        if (i > endloop - offset - 4) {
            i -= looplength;
        }
        const index = Math.floor(i); // javascript privileges hehe 
        console_1.assert(index != NaN, 'nan index');
        const v = sdpa.readInt16LE(index * 2);
        const f = s16tof32_1.s16tof32(v);
        if (j >= output.byteLength)
            break;
        output.writeFloatLE(f, j * 4);
        output.writeFloatLE(f, j * 4 + 4);
    }
    return output;
}
exports.memcopy = memcopy;
function resolvebuffer(presetId, midi, velocity, seconds) {
    let n = seconds * 48000;
    const output = Buffer.allocUnsafe(n * 4 * 2);
    return memcopy(findIndex(presetId, midi, velocity), output, n);
}
exports.resolvebuffer = resolvebuffer;
