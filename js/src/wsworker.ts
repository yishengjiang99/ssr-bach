const ctx = self;
const wss = new WebSocket("ws://localhost:8081");

let procPort;
wss.onopen = () => {
  ctx.postMessage("ws open");
};

// const ptr = fifo();
// fifo_init(ptr, 1024 * 255);

ctx.onmessage = ({ data: { url, cmd, port } }) => {
  if (port) {
    procPort = port;
  }
  if (url) {
    const sbr = new SharedArrayBuffer(1024 * 16 + 64);
    const stateBuffer = new Uint32Array(sbr, 0);
    const ub = new Uint8Array(sbr, 64);
    stateBuffer[0] = 0;

    wss.addEventListener("message", async ({ data }) => {
      if (typeof data === "string") {
        ctx.postMessage(data);
      } else if (data instanceof Blob) {
        data.arrayBuffer().then((ab) => {
          let wptr = stateBuffer[0];
          for (const i in ab) {
            ub[wptr + i] = ab[i];
          }
          stateBuffer[0] += ab.byteLength;
          if (stateBuffer[0] >= ub.byteLength - 1) {
            stateBuffer[0] = 0;
            procPort.postMessage({ looped: 1 });
          }
        });
      }
    });
    procPort.postMessage({ sbr });
    wss.send("play " + url);
  }
  if (cmd) {
    wss.send(cmd);
  }
};
