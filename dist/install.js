"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.installNotesFromCsv = void 0;
const https_1 = require("https");
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
const open = Buffer.from(":{},");
function dl(soundfont, setname) {
    https_1.request(sfUrl(soundfont, setname), (res) => {
        res.on("data", (d) => {
            while (d.shift() !== 0) { }
        });
    });
}
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
        const uniqnotes = execSync(`grep ${fontname} ${csvfile} |grep -v '#'|cut -f2 -d','|sort |uniq`)
            .toString()
            .trim()
            .split("\n");
        for (const midi of uniqnotes) {
            if (!midi)
                continue;
            mkfolder(`midisf/${fontname}`);
            const index = midi - 21;
            const pcmname = `midisf/${fontname}/${index}.pcm`;
            console.log(pcmname);
            try {
                console.log(`dd if=${localname} bs=${bytesPerNote} skip=${index} count=1 of=pipe:1|ffmpeg -y -hide_banner -loglevel panic -f mp3 -i pipe:0 -f f32le -ac 1 -ar 48000 ${pcmname}`);
                execSync(`dd if=${localname} bs=${bytesPerNote} skip=${index} count=1 |ffmpeg -y -hide_banner -loglevel panic -f mp3 -i pipe:0 -f f32le -ac 1 -ar 48000 ${pcmname}`);
            }
            catch (e) {
                console.log(e);
            }
        }
    }
};
// installNotesFromCsv("/home/AzureUser/ssr-bach/csv/serenade_k361_3rd-mid.csv");
if (process.argv[2]) {
    const csvfile = process.argv[2] || "";
    const setname = process.argv[3] || "FatBoy";
    exports.installNotesFromCsv(csvfile, setname);
}
for (const localname of readdirSync("./mp3")) {
    const byteswrote = parseInt(execSync("wc -c mp3/" + localname)
        .toString()
        .trim()
        .split(/\s+/)[0]);
    const bytesPerNote = ~~(byteswrote / 88 / 4) * 4;
    const fontname = localname.replace("FatBoy_", "").replace(".js", "");
    for (let index = 0; index < 88; index++) {
        //  mkfolder(`midisf/${fontname}`);
        const pcmname = `midisf/${fontname}/${index}.pcm`;
        console.log(pcmname);
        try {
            console.log(`dd if=mp3/${localname} bs=${bytesPerNote} skip=${index} count=1 of=pipe:1|ffmpeg -y -hide_banner -loglevel panic -f mp3 -i pipe:0 -f f32le -ac 1 -ar 48000 ${pcmname}`);
            execSync(`dd if=mp3/${localname} bs=${bytesPerNote} skip=${index} count=1 |ffmpeg -y -hide_banner -loglevel panic -f mp3 -i pipe:0 -f f32le -ac 1 -ar 48000 ${pcmname}`);
        }
        catch (e) {
            console.log(e);
        }
    }
    execSync(`mv mp3/${localname} done`);
}
//# sourceMappingURL=install.js.map