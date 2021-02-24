"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notelist = exports.handleSamples = void 0;
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const handleSamples = ({ who, parts }, res) => {
    const instment = parts[2];
    const note = parts[3];
    console.log(parts);
    if (parts[3] && fs_1.existsSync("./midisf/" + instment + "/" + note + ".pcm")) {
        res.writeHead(200, { "Content-Type": "audio/mp3" });
        const proc = child_process_1.spawn("ffmpeg", `-f f32le -ar 48000 -ac 1 -i ${"./midisf/" + instment + "/" + note + ".pcm"} -f wav -`.split(" "));
        proc.on("error", (d) => console.error(d.toString()));
        proc.stdout.pipe(res);
    }
    else {
        res.writeHead(200, {
            "Content-Type": "text/HTML",
            "set-cookie": "who=" + who,
        });
        exports.notelist(res);
    }
};
exports.handleSamples = handleSamples;
const notelist = (res, format = "pcm") => {
    const sections = fs_1.readdirSync("./midisf");
    res.write("<iframe name=_w1></iframe>");
    for (const section of sections) {
        const links = fs_1.readdirSync("midisf/" + section).filter((n) => n);
        res.write("<div class='mt-25'></div>");
        res.write(`<div><span>${section}</span>
      ${links.map((n) => {
            const nn = n.replace("48000-mono-f32le-", "").replace(".pcm", "");
            return `<a target=_w1 href="/samples/${section}/${nn}"> ${nn} </a>`;
        })}
      </div>`);
    }
};
exports.notelist = notelist;
