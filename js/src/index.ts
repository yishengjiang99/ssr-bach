import { printrx, stdout, logtime } from "./misc-ui.js";
import { EventsPanel } from "./panel.js";
import { onStats, updateMeterMaxrange } from "./stats.js";
import { drawmeta as drawTracks } from "./TrackInfo.js";
import start from "./start.js";

const wschan = new BroadcastChannel("wschan");
wschan.onmessage = ({ data: { stats, msg, event, info } }) => {
  if (event === "#time") {
    printrx(info.second, 1);
  } else if (event === "#tempo") {
    printrx(info.bpm, 2);
  } else if (event === "#meta") {
    drawTracks(info);
  }
  // if (info.seconds) updateMeterMaxrange(info.seconds);
  if (msg) {
    if (logtime) logtime(msg);
    else stdout(msg);
  }
  if (stats) onStats(stats);
};

const selector = document.querySelector("select");
const button = document.querySelector("button");
button.onclick = () => start(selector.value);
selector.onchange = () => {
  start(selector.value);
};
