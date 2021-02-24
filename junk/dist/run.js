"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadSound = exports.init = void 0;
const fs_1 = require("fs");
const Module = require("./readnode");
let api;
async function init() {
    await new Promise(resolve => {
        Module.addOnInit(resolve);
    });
    const ff = fs_1.readFileSync("./file.sf2");
    const p = Module._malloc(ff.byteLength);
    Module.HEAP8.set(ff, p);
    Module._read_sf(p, ff.byteLength);
    api = {
        loadSound: Module.cwrap("load_sound", '', ['number', 'number', 'number', 'number', 'number'])
    };
}
exports.init = init;
exports.loadSound = newFunction();
exports.loadSound(0, 33, 44, 1);
function newFunction() {
    return async (presetId, midi, velocity, duration) => {
        if (!api)
            await init();
        const n = 4800 * duration * 2;
        const ptr = Module._malloc(n);
        console.log("hi00");
        api.loadSound(ptr, 0, 55, 100, n); //._load_sound(ptr, presetId, midi, velocity, n);
        console.log("sss");
        const r = new Float32Array(Module.HEAPF32.buffer, ptr, n);
        Module._free(ptr);
        return r;
    };
}
