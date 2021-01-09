import { cdiv } from "./misc-ui.js";
let seeklock = null,
  sliderlocks = {};
let worker, ctx;

const aggregatedFeed = new TransformStream();

export const UISlider = ({
  parent = "#stats",
  worker,
  cmd,
  attribute,
  label = "",
  defaultValue = 12,
  min = -12,
  max = -12,
  step = 0.1,
}) => {
  worker = worker;
  let formdata: FormData = new FormData();
  let sliderr = slider(document.querySelector(parent), {
    ...{ value: defaultValue, min, max, step, label },
    oninput: async (e: InputEvent) => {
      if (sliderlocks[attribute]) return;
      sliderlocks[attribute] = true;
      formdata.set("attribute", sliderr.value);
      const resp = await fetch("/update", { method: "post", body: formdata });
      resp.body
        .getReader()
        .read()
        .then((result) => {});
      sliderlocks[attribute];
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
export const loadProc = async (ctx) => {
  if (true || ctx.audioWorklet.module) {
    await ctx.audioWorklet.addModule("./js/build/proc2.js");
  }

  let aproc = new AudioWorkletNode(ctx, "playback-processor", {
    outputChannelCount: [2],
  });
  await new Promise<void>((resolve) => {
    aproc.port.onmessage = ({ data }) => {
      resolve();
    };
  });
  return aproc;
};

export function slider(container, options) {
  var params = options || {};
  var input = document.createElement("input");
  input.min =
    (params.min !== null && params.min) || (params.prop && params.prop.minValue) || "-12";
  input.max =
    (params.max !== null && params.max) || (params.prop && params.prop.maxValue) || "12";
  input.type = params.type || "range";
  input.defaultValue = (params.prop && params.prop.value.toString()) || params.value;
  input.step = params.step || "0.1";
  var label = document.createElement("span");

  if (input.type == "range") {
    label.innerHTML =
      params.label || (params.prop && params.prop.value.toString()) || params.value;
  } else {
    input.size = 10;
  }
  if (options.oninput) {
    input.oninput = options.oninput;
  } else {
    input.oninput = (e) => {
      params.prop.setValueAtTime(input.value, 0);
      label.innerHTML = input.value + "";
    };
  }
  if (options.eventEmitter) {
    options.eventEmitter();
  }
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
