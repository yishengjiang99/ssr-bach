import { cdiv } from "./misc-ui.js";
let seeklock = null;
let worker, ctx;
export const playbackSlider = ({ worker, ctx }) => {
  seeklock = null;
  worker = worker;
  let sliderr = slider(document.querySelector("#stats"), {
    label: "playback",
    step: "1",
    max: "600",
    min: "0",
    oninput: async (e: InputEvent) => {
      debugger;
      if (seeklock) return;
      seeklock = true;
      await worker.postMessage({ cmd: "seek " + sliderr.value });
      seeklock = false;
    },
    wrapper: "span",
  });
  return sliderr;
};

export const postSeek = async (val) => {
  const newProc = await loadProc(ctx);
  worker.postMessage({ cmd: "seek " + val, port: newProc });
  await new Promise((r) => {
    worker.addEventListener(
      "message",
      ({ data }) => {
        if (data === "ackseek") {
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

  if (!container) {
    return contain;
  } else container.append(contain);
  return input;
}
