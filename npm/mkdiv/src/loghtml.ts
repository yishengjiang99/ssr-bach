import { mkdiv as h } from "./mkdiv.js";
declare type LogDivProps = {
  container?: HTMLElement;
  containerID?: string;
};
export function logdiv({ container, containerID }: LogDivProps = {}) {
  const logs: string[] = [];
  const errPanel = h("div");
  const infoPanel = h("pre", { style: "height:200px;overflow-y:scroll" });
  const stderr = (str: string) => (errPanel.innerHTML = str);
  const stdout = (log: string) => {
    logs.push(performance.now() / 1e6 + ":" + log);
    if (logs.length > 100) logs.shift();
    infoPanel.innerHTML = logs.join("\n");
  };
  (
    (containerID && document.getElementById(containerID)) ||
    container ||
    document.body
  ).append(h("div", {}, [errPanel, infoPanel]));
  return {
    stderr,
    stdout,
  };
}
