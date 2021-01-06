"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.installNotesFromCsv = void 0;
const execSync = require("child_process").execSync;
const { existsSync, readdirSync, readFileSync } = require("fs");
const { execFile, exec } = require("child_process");
const sfUrl = (setname, fontname) => `https://gleitz.github.io/midi-js-soundfonts/${setname}/${fontname}-mp3.js`;
const format = (str) => str
    .replace(" ", "_")
    .replace(" ", "_")
    .replace(" ", "_")
    .replace(" ", "_")
    .replace("(", "")
    .replace(")", "")
    .trim();
const mkfolder = (folder) => existsSync(folder) || execSync(`mkdir ${folder}`);
"midisf,db,csv,mp3".split(",").map((f) => f && mkfolder(f));
exports.installNotesFromCsv = (csvfile, setname = "FatBoy") => {
    for (const name of execSync("cat " + csvfile + "|grep -v '#'|cut -f6 -d','|sort |uniq|grep -v ^$")
        .toString()
        .trim()
        .split("\n")) {
        if (name === "")
            continue;
        const fontname = format(name).replace("\t", "");
        if (!fontname)
            continue;
        if (fontname === "Binary_file_standard_input_matches")
            continue;
        const localname = "mp3/" + setname + "_" + fontname + ".js";
        if (!existsSync(localname)) {
            execSync(`curl -s "${sfUrl(setname, fontname)}" -o - |grep 'data:audio/mp3;base64,' |awk -F 'data:audio/mp3;base64,' '{print $2}'|tr '\"\n,\"' '\n'| grep -v ^$ |base64 --decode > ${localname}`);
        }
        mkfolder(`midisf/${fontname}`);
        const byteswrote = parseInt(execSync("wc -c " + localname)
            .toString()
            .trim()
            .split(/\s+/)[0]);
        const bytesPerNote = ~~(byteswrote / 88 / 4) * 4;
        for (let index = 0; index < 88; index++) {
            const pcmname = `midisf/${fontname}/${index}.pcm`;
            try {
                if (!existsSync(pcmname)) {
                    console.log(pcmname);
                    execSync(`dd if=${localname} bs=${bytesPerNote} skip=${index} count=1 |ffmpeg -y -hide_banner -loglevel panic -f mp3 -i pipe:0 -f f32le -ac 1 -ar 48000 ${pcmname}`);
                }
            }
            catch (e) {
                console.log(e);
            }
        }
    }
};
//# sourceMappingURL=install.js.map