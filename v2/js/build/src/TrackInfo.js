import { cdiv } from "./misc-ui.js";
const cp = document.querySelector("#cp");
export function drawmeta(info) {
    cp.innerHTML = "";
    const trackRow = ({ instrument, trackId }) => cdiv("div", {}, `${trackId}. ${instrument}`);
    const divpanel = cdiv("div", {}, [
        cdiv("h4", {}, "tracks"),
        ...info.map((t) => trackRow(t)),
    ]);
    cp.appendChild(divpanel);
}
