/* @ts-ignore */
let procPort;
onmessage = async ({ data: { port, url } }) => {
  if (port) procPort = port;
  const transform = new TransformStream();
  (async () => {
    const resp = await fetch(url);
    resp.body.pipeTo(transform.writable, { preventClose: true });
  })();
  procPort.postMessage({ url, readable: transform.readable }, [
    transform.readable,
  ]);
};
