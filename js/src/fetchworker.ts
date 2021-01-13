let controller = new AbortController();
const queue: { from: number; to: number; url: string }[] = [];
/* @ts-ignore */
let procPort: MessagePort;

onmessage = (e) => {
  const { data } = e;
  const { cmd, msg, port, url, procReset } = data;

  if (port) {
    procPort = port;
  }
  if (cmd) {
    if (procPort) procPort.postMessage({ cmd: cmd });
  }
  if (procReset) {
    if (procPort) procPort.postMessage({ reset: 1 });
  }

  if (url && procPort) {
    procPort.onmessage = (e) => {
      // @ts-ignore
      postMessage(e.data);
    };
    let offset = 0;
    queue.push({ from: 0 * 1024 * 1024, to: 1 * 1024 * 1024, url });
    offset = offset + 1 * 1024 * 1024;
    const transform = new TransformStream();
    if (controller) {
      try {
        controller.abort();
      } catch (e) {
        //ignore
      }
    }
    controller = new AbortController();
    controller.signal.onabort = () => {
      //("abort",()=>{
    };
    async function loop(controller) {
      try {
        if (queue.length == 0) return;
        const { url, from, to } = queue.shift();
        const resp = await fetch(url, {
          signal: controller.signal,
          headers: { "if-range": "bytes=" + from + "-" + to },
        });
        if (transform.writable.locked) {
          //@ts-ignore
          postMessage({ readable: resp.body }, [resp.body]);
        } else {
          resp.body.pipeTo(transform.writable, { preventClose: true });
        }
        if (resp.status === 206) {
          queue.push({ url, from: offset, to: offset + 1024 * 1024 });
          offset = offset + 1 * 1024 * 1024;
        }
      } catch (e) {
        console.log(e);
      }
    }
    loop(controller);
    // @ts-ignore
    procPort.postMessage({ url, readable: transform.readable }, [transform.readable]);
  }
};
