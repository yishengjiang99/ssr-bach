let controller;
const queue: { from: number; to: number; url: string }[] = [];
/* @ts-ignore */
let procPort: MessagePort;

onmessage = (e) => {
  let wschan = new BroadcastChannel("wschan");
  const { data } = e;
  const { port, url } = data;
  if (url && procPort) {
    procPort.onmessage = (e) => {
      // @ts-ignore
      setTimeout(wschan.postMessage(e.data), 0);
    };
    let offset = 0;
    queue.push({ from: 0 * 1024 * 1024, to: 1 * 1024 * 1024, url });
    offset = offset + 1 * 1024 * 1024;
    postMessage({ msg: "fetch start" });

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

    (async (_) => {
      async function* loop(controller) {
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
        yield;
      }
      const g = loop(controller);
      for await (const _ of await g);
    })();

    // @ts-ignore
    procPort.postMessage({ url, readable: transform.readable }, [transform.readable]);
    postMessage({ msg: "sharing readable with proc frame" });
  }
};
