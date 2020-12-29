const cdiv = (tag, attributes = {}, children = []) => {
    const div = document.createElement(tag);
    Object.keys(attributes).map((k) => {
        div[k] = attributes[k];
    });
    children.map((c) => div.append(c));
    return div;
};
const startBtn = (clickStart) => {
    const strtbtn = document.createElement("button");
    strtbtn.innerHTML = "start";
    document.body.append(strtbtn);
    strtbtn.onclick = clickStart;
    return strtbtn;
};
const $ = document.querySelector;
const stdoutPanel = (parentDiv) => {
    parentDiv = parentDiv || document.body;
    const std = cdiv("pre", { id: "std" });
    const linkdiv = cdiv("span");
    function stdout(str) {
        std.innerHTML = str + "\n" + std.innerHTML;
    }
    const rx1 = cdiv("span", { id: "rx1" });
    function printrx(str) {
        rx1.innerHTML = str;
    }
    parentDiv.append(rx1);
    parentDiv.append(std);
    return {
        stdout,
        std,
        printrx,
        printlink: (href, name) => {
            linkdiv.innerHTML += `<a href='${href}'>${name}</a>`;
        },
    }; //
};
startBtn(async function (e) {
    e.target.disabled = true;
    e.target.innerHTML = "waiting";
    ctx = new AudioContext({ sampleRate: 48000, latencyHint: "playback" });
    if (!proc) {
        try {
            await ctx.audioWorklet.addModule("./js/build/proc2.js");
            proc = new AudioWorkletNode(ctx, "playback-processor", {
                outputChannelCount: [2],
            });
            await new Promise((resolve) => {
                proc.port.onmessage = ({ data }) => {
                    resolve();
                };
            });
            worker.postMessage({ port: proc.port }, [proc.port]);
            proc.connect(ctx.destination);
            printrx("u win");
            const b2 = document.createElement("button");
            b2.innerHTML = "play";
            b2.onclick = () => {
                worker.postMessage({ url: "/pcm" });
            };
            const b3 = document.createElement("button");
            b3.onclick = () => {
                worker.postMessage({ cmd: "pause" });
            };
            b2.innerHTML = "pause";
            b3.disabled = true;
            document.body.append(b2);
            document.body.append(b3);
        }
        catch (err) {
            alert("u wilosen");
            console.log(err);
        }
    }
});
const { printrx, printlink, stdout } = stdoutPanel(document.querySelector("header"));
stdout("loaded");
const main = document.querySelector("main");
const worker = new Worker("js/build/ws-worker.js", {
    type: "module",
});
worker.onmessage = ({ data }) => {
    //  requestAnimationFrame(() => printrx(JSON.stringify(data.stats)));
    requestAnimationFrame(() => {
        if (data.msg)
            printrx(data.msg);
        if (data.stats) {
            printrx(JSON.stringify(data.stats));
        }
        if (data.link) {
            stdout(`<a href='${data.link}'>${data.note}</a>`); /// + " " + data.name);
        }
    });
};
let ctx;
let proc;
startBtn(async function (e) {
    e.target.disabled = true;
    e.target.innerHTML = "waiting";
    ctx = new AudioContext({ sampleRate: 48000, latencyHint: "playback" });
    if (!proc) {
        try {
            await ctx.audioWorklet.addModule("./js/build/proc2.js");
            proc = new AudioWorkletNode(ctx, "playback-processor", {
                outputChannelCount: [2],
            });
            await new Promise((resolve) => {
                proc.port.onmessage = ({ data }) => {
                    resolve();
                };
            });
            worker.postMessage({ port: proc.port }, [proc.port]);
            proc.connect(ctx.destination);
            printrx("u win");
            const b2 = document.createElement("button");
            b2.innerHTML = "play";
            b2.onclick = () => {
                worker.postMessage({ url: "/pcm" });
            };
            const b3 = document.createElement("button");
            b3.onclick = () => {
                worker.postMessage({ cmd: "pause" });
            };
            b2.innerHTML = "pause";
            b3.disabled = true;
            document.body.append(b2);
            document.body.append(b3);
        }
        catch (err) {
            alert("u wilosen");
            console.log(err);
        }
    }
});
// const menu = document.querySelector("table");
// const conso = document.createElement("input");
// conso.type = "text";
// conso.onkeydown = (e) => {
//   if (e.key === "enter") {
//     worker.postMessage({ cmd: conso.value });
//     conso.value = "";
//   }
// };
// document.body.ondblclick = () => worker.postMessage({ cmd: "stop" });
// document.body.append(conso);
if (window.BroadcastChannel) {
    const rfc = new BroadcastChannel("rfc");
    rfc.onmessage = ({ data }) => {
        worker.postMessage(data);
    };
}
