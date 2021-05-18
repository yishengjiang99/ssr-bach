"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logdiv = void 0;
const mkdiv_js_1 = require("./mkdiv.js");
function logdiv({ container, containerID } = {}) {
    const logs = [];
    const errPanel = mkdiv_js_1.mkdiv("div");
    const infoPanel = mkdiv_js_1.mkdiv("pre", { style: "height:200px;overflow-y:scroll" });
    const stderr = (str) => (errPanel.innerHTML = str);
    const stdout = (log) => {
        logs.push(performance.now() / 1e6 + ":" + log);
        if (logs.length > 100)
            logs.shift();
        infoPanel.innerHTML = logs.join("\n");
    };
    ((containerID && document.getElementById(containerID)) ||
        container ||
        document.body).append(mkdiv_js_1.mkdiv("div", {}, [errPanel, infoPanel]));
    return {
        stderr,
        stdout,
    };
}
exports.logdiv = logdiv;
