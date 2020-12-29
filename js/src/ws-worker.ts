const wss: WebSocket = new WebSocket("wss://www.grepawk.com");
let procPort: MessagePort;
wss.onopen = () => {
  //@ts-ignore
  postMessage("ws open");
  wss.onmessage = ({ data }) => {
    if (data[0] == "{") {
      //@ts-ignore
      postMessage(JSON.parse(data));
    } else {
      //@ts-ignore

      postMessage(data);
    }
  };
};
const queue: { from: number; to: number; url: string }[] = [];
/* @ts-ignore */
onmessage = (e) => {
  const {
    data: { cmd, msg, port, url },
  } = e;
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
    queue.push({ from: 0 * 1024 * 1024, to: 2 * 1024 * 1024, url });
    offset = offset + 2 * 1024 * 1024;
    async function loop() {
      try {
        if (queue.length == 0) return;
        const { url, from, to } = queue.shift();
        const resp = await fetch(url, {
          headers: { "if-range": "bytes=" + from + "-" + to },
        });
        // @ts-ignore
        procPort.postMessage({ readable: resp.body }, [resp.body]);
        procPort.onmessage = (e) => {
          //@ts-ignore
          postMessage(e.data);
        };
        if (resp.status !== 206) return;
        else {
          queue.push({ url, from: offset, to: offset + 1024 * 1024 });
          offset = offset + 1 * 1024 * 1024;
        }
        if (queue.length) loop();
      } catch (e) {
        console.log(e);
      }
    }
    loop();
    // @ts-ignore
    //  procPort.postMessage({ readable }, [readable]);
  }
};
