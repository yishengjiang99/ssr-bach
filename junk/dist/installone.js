"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.installOnServerIfNeeded = void 0;
const { existsSync, readFileSync, readdirSync } = require("fs");
const { execFile, execSync } = require("child_process");
const installOnServerIfNeeded = (fontname, setname) => {
    if (existsSync("midisf/" + setname + "/" + fontname) &&
        readdirSync("midisf/" + setname + "/" + fontname).length >= 88) {
        return true;
    }
    const sfUrl = (setname, fontname) => `https://gleitz.github.io/midi-js-soundfonts/${setname}/${fontname}-mp3.js`;
    const localname = "mp3/" + setname + "_" + fontname + ".js";
    const mkfolder = (folder) => existsSync(folder) || execSync(`mkdir ${folder}`);
    "midisf,db,csv,mp3".split(",").map((f) => f && mkfolder(f));
    execSync(`curl -s "${sfUrl(setname, fontname)}" -o - |grep 'data:audio/mp3;base64,' |awk -F 'data:audio/mp3;base64,' '{print $2}
  '|tr '\"\n,\"' '\n'| grep -v ^$ |base64 --decode > ${localname}`);
    mkfolder(`midisf/${fontname}`);
    const byteswrote = parseInt(execSync("wc -c " + localname)
        .toString()
        .trim()
        .split(/\s+/)[0]);
    const bytesPerNote = ~~(byteswrote / 88 / 4) * 4;
    for (let i = 0; i < 88; i++) {
        if (!i)
            continue;
        mkfolder(`midisf/${fontname}`);
        const index = i;
        const pcmname = `midisf/${fontname}/stereo-${index}.pcm`;
        console.log(pcmname);
        try {
            console.log(`dd if=${localname} bs=${bytesPerNote} skip=${index} count=1 of=pipe:1|ffmpeg -y -hide_banner -loglevel panic -f mp3 -i pipe:0 -f f32le -ac 1 -ar 48000 ${pcmname}`);
            execSync(`dd if=${localname} bs=${bytesPerNote} skip=${index} count=1 |ffmpeg -y -hide_banner -loglevel panic -f mp3 -i pipe:0 -f f32le -ac 2 -ar 48000 ${pcmname}`);
        }
        catch (e) {
            console.log(e);
        }
    }
};
exports.installOnServerIfNeeded = installOnServerIfNeeded;
if (process.argv[2]) {
    const setname = "FatBoy";
    const fontname = process.argv[2];
    exports.installOnServerIfNeeded(fontname, setname);
}
