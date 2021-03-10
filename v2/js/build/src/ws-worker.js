const wss = new WebSocket("%WSHOST%");
// @ts-ignore
const wschan = new BroadcastChannel("wschan");
wss.onopen = () => {
    //@ts-ignore
    postMessage({ msg: "ws open" });
    wss.onmessage = (e) => {
        if (e.data.blob) {
            e.data.text().then((t) => {
                wschan.postMessage(t);
            });
        }
        else if (e.data[0] == "{") {
            wschan.postMessage(JSON.parse(e.data.toString()));
        }
        wschan.postMessage(e.data.toString());
    };
};
onmessage = ({ data }) => {
    if (data.cmd) {
        if (wss)
            wss.send(data.cmd);
    }
};
/*
when switching between playbacks, the seek time is carried over..
*/
