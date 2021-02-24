"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cspawn = void 0;
const child_process_1 = require("child_process");
function cspawn(str, [p0, p1, p2] = []) {
    let t = str.split(" ");
    const cp = child_process_1.spawn(t.shift(), t);
    const { stdin, stdout, stderr } = cp;
    if (p0) {
        p0.pipe(stdin);
    }
    if (p1)
        stdout.pipe(p0);
    if (p2)
        stderr.pipe(p2);
    stdout.on("error", (e) => {
        console.log(e.toString());
    });
    return cp;
}
exports.cspawn = cspawn;
