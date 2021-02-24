"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.installPiano = exports.installNotesFromCsv = void 0;
const fs_1 = require("fs");
const child_process_1 = require("child_process");
const utils_1 = require("./utils");
const ffmpeg_templates_1 = require("./ffmpeg-templates");
const midi_1 = require("@tonejs/midi");
const installNotesFromCsv = (midiname, setname = "FatBoy") => {
    const sfUrl = (setname, fontname) => `https://gleitz.github.io/midi-js-soundfonts/${setname}/${fontname}-mp3.js`;
    const mkfolder = (folder) => fs_1.existsSync(folder) || child_process_1.execSync(`mkdir ${folder}`);
    // "midisf,db,csv,mp3".split(",").map((f) => f && mkfolder(f));
    new midi_1.Midi(fs_1.readFileSync(midiname)).tracks.map((t) => {
        console.log(process.uptime());
        t.instrument.percussion
            ? fs_1.existsSync("fast-a-" + utils_1.std_drums[t.instrument.number] + "-0-88.pcm") ||
                child_process_1.spawnSync("./installsf", [utils_1.std_drums[t.instrument.number] + "", "fast"])
            : fs_1.existsSync("mid-a-" + t.instrument.number + "-0-88.pcm") ||
                child_process_1.spawnSync("./installsf", [t.instrument.number + "", "mid"]);
    });
};
exports.installNotesFromCsv = installNotesFromCsv;
const installPiano = (vel) => {
    let midi = 1;
    let cmds = [];
    ["C", "D#", "F#", "A"].map((note, index) => {
        [1, 2, 3, 4, 5, 6, 7].map((octave) => {
            const refmidi = (octave - 1) * 12 + index * 3 + 3;
            [0, 1, 2].map((ref) => {
                const file = `midisf/acoustic_grand_piano/${refmidi + ref}v${vel}.pcm`;
                child_process_1.execSync(`ffmpeg ${ffmpeg_templates_1.qclause} -i /Users/yisheng/Documents/GitHub/ssr-bach/48khz24bit/${note}${octave}v${vel}.wav -af atempo=${Math.pow(2, ref / 12)} -f f32le ${file}`);
                //  process.exit();
            });
        });
    });
    let aa = "A0";
};
exports.installPiano = installPiano;
if (process.argv[2]) {
    exports.installNotesFromCsv(process.argv[2]);
}
else {
    exports.installNotesFromCsv("./midi/song.mid");
}
// installPiano(1);
// installPiano(16);
// installPiano(5);
