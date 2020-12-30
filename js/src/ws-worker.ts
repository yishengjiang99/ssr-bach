import { Transform } from "stream";

const wss: WebSocket = new WebSocket("wss://www.grepawk.com?cookie=WHO");
let procPort: MessagePort;
wss.onopen = () => {
  //@ts-ignore
  postMessage({ msg: "ws open" });
  wss.onmessage = ({ data }) => {
    if (data[0] == "{") {
      //@ts-ignore
      postMessage({ playback: JSON.parse(data) });
    } else {
      //@ts-ignore
      postMessage({ msg: "Server: " + data });
    }
  };
};
const queue: { from: number; to: number; url: string }[] = [];
/* @ts-ignore */
onmessage = (e) => {
  const { data } = e;
  const { cmd, msg, port, url } = data;
  //@ts-ignore
  postMessage("act" + [cmd, msg, port, url].join(" "));
  console.log(e.data);
  if (port) {
    procPort = port;
  }
  if (cmd) {
    wss.send(cmd);
  }
  if (url && procPort) {
    procPort.onmessage = (e) => {
      //@ts-ignore
      postMessage(e.data);
    };
    let offset = 0;
    queue.push({ from: 0 * 1024 * 1024, to: 1 * 1024 * 1024, url });
    offset = offset + 1 * 1024 * 1024;
    const transform = new TransformStream();
    async function loop() {
      try {
        if (queue.length == 0) return;
        const { url, from, to } = queue.shift();
        const resp = await fetch(url, {
          headers: { "if-range": "bytes=" + from + "-" + to },
        });
        if (transform.writable.locked) {
          //@ts-ignore
          postMessage({ readable: resp.body }, [resp.body]);
        } else {
          resp.body.pipeTo(transform.writable, { preventClose: true });
        }

        queue.push({ url, from: offset, to: offset + 1024 * 1024 });
        offset = offset + 1 * 1024 * 1024;
      } catch (e) {
        console.log(e);
      }
    }
    loop();
    // @ts-ignore
    procPort.postMessage({ readable: transform.readable }, [
      transform.readable,
    ]);
  }
};
