import { mkdiv as h } from "./mkdiv.js";
export function logdiv({ container, containerID } = {}) {
    const logs = [];
    const errPanel = h("div");
    const infoPanel = h("pre", { style: "height:200px;overflow-y:scroll" });
    const stderr = (str) => (errPanel.innerHTML = str);
    const stdout = (log) => {
        logs.push(performance.now() / 1e6 + ":" + log);
        if (logs.length > 100)
            logs.shift();
        infoPanel.innerHTML = logs.join("\n");
    };
    ((containerID && document.getElementById(containerID)) ||
        container ||
        document.body).append(h("div", {}, [errPanel, infoPanel]));
    return {
        stderr,
        stdout,
    };
}
