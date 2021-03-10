import { cdiv } from "./misc-ui.js";
let seeklock = null,
  sliderlocks = {};
let worker, ctx;

const aggregatedFeed = new TransformStream();

export const UISlider = ({
  parent = "#stats",
  worker,
  cmd = "config",
  attribute,
  label = "",
  defaultValue = 12,
  min = -12,
  max = 12,
  step = 0.1,
}) => {
  worker = worker;
  let sliderr = slider(document.querySelector(parent), {
    ...{ value: defaultValue, min, max, step, label },
    oninput: async (e: InputEvent) => {
      worker.postMessage({ cmd: `${cmd} ${attribute} ${sliderr.value}` });
    },
    wrapper: "span",
  });
  return sliderr;
};
const wschan = new BroadcastChannel("wschan");
// aggregatedFeed.readable.on("data", (d) => wschan.postMessage(d));
export const postSeek = async (val) => {
  // const newProc = await loadProc(ctx);
  worker.postMessage({ cmd: "seek " + val });
  await new Promise((r) => {
    wschan.addEventListener(
      "message",
      ({ data: { ack } }) => {
        if (ack === "seek") {
          r(1);
        }
      },
      { once: true }
    );
  });
};

export function slider(container, options) {
  var params = options || {};
  var input = document.createElement("input");
  input.min = params.min !== null ? params.min : "-12";
  input.max = params.max !== null ? params.max : "12"; //|| "12";
  input.type = "range";
  input.step = params.step || 0.1;
  input.value = params.defaultValue !== null ? params.defaultValue : 0;
  var label = document.createElement("span");
  label.innerHTML = params.label + ": " + input.value;

  input.oninput = (e) => {
    if (params.props) params.prop.setValueAtTime(input.value, 0);
    if (label) label.innerHTML = params.label + " " + input.value + "";
    if (params.oninput) options.oninput(e);
  };

  var contain = document.createElement(params.wrapper || "td");
  contain.style.position = "relative";
  label.style.minWidth = "4em";
  if (params.name) {
    contain.append(cdiv("span", {}, params.name));
  }
  if (params.className) {
    input.className = params.className;
  }
  contain.append(input);
  contain.append(label);

  if (container) {
    container.append(contain);
  }
  return input;
}
