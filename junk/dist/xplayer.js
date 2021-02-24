"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const process_1 = require("process");
let file = 'midi/song.mid';
const rt = child_process_1.execSync(`strings -o ${file}|grep -i mtrk`).toString().split("\n").map(line => {
    return line.trim().split(" ")[0];
});
console.log(rt);
process_1.exit;
