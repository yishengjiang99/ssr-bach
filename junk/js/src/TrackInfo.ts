import { cdiv } from "./misc-ui.js";

const cp = document.querySelector("#cp");
type TrackInfo = { trackId: number; instrument: string };
export function drawmeta(info: TrackInfo[]) {
  cp.innerHTML = "";
  const trackRow = ({ instrument, trackId }: TrackInfo) =>
    cdiv("div", {}, `${trackId}. ${instrument}`);
  const divpanel = cdiv("div", {}, [
    cdiv("h4", {}, "tracks"),
    ...info.map((t) => trackRow(t)),
  ]);
  cp.appendChild(divpanel);
}
