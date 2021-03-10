/* @ts-ignore */
let procPort;
onmessage = async ({ data: { port, url } }) => {
    const transform = new TransformStream();
    (async () => {
        const resp = await fetch(url);
        resp.body.pipeTo(transform.writable, { preventClose: true });
    })();
    port.postMessage({ url, readable: transform.readable }, [transform.readable]);
};
