"use strict";
let procPort;
onmessage = async ({ data: { port, url } }) => {
    if (port) {
        procPort = port;
        procPort.onmessage = ({ data }) => {
            postMessage(data);
        };
    }
    if (url) {
        const transform = new TransformStream();
        (async () => {
            const resp = await fetch(url);
            resp.body.pipeTo(transform.writable, { preventClose: true });
        })();
        procPort.postMessage({ url, readable: transform.readable }, [
            transform.readable,
        ]);
    }
};
