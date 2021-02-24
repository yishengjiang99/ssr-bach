import { existsSync, readdirSync, readFileSync, createWriteStream } from "fs";
import { request } from "https";
import * as zlib from "zlib";
import { DrumKitByPatchID } from "@tonejs/midi/dist/InstrumentMaps";
import { execSync, exec, execFile, execFileSync, spawnSync } from "child_process";
import { std_drums, std_inst_names } from "./utils";
import { cspawn } from "./cspawn";
import { qclause } from "./ffmpeg-templates";
import { Midi } from "@tonejs/midi";
export const installNotesFromCsv = (midiname: string, setname = "FatBoy"): void => {
  const sfUrl = (setname, fontname) =>
    `https://gleitz.github.io/midi-js-soundfonts/${setname}/${fontname}-mp3.js`;

  const mkfolder = (folder) => existsSync(folder) || execSync(`mkdir ${folder}`);
  // "midisf,db,csv,mp3".split(",").map((f) => f && mkfolder(f));

  new Midi(readFileSync(midiname)).tracks.map((t) => {
    console.log(process.uptime());
    t.instrument.percussion
      ? existsSync("fast-a-" + std_drums[t.instrument.number] + "-0-88.pcm") ||
        spawnSync("./installsf", [std_drums[t.instrument.number] + "", "fast"])
      : existsSync("mid-a-" + t.instrument.number + "-0-88.pcm") ||
        spawnSync("./installsf", [t.instrument.number + "", "mid"]);
  });
};

export const installPiano = (vel) => {
  let midi = 1;
  let cmds = [];
  ["C", "D#", "F#", "A"].map((note, index) => {
    [1, 2, 3, 4, 5, 6, 7].map((octave) => {
      const refmidi = (octave - 1) * 12 + index * 3 + 3;
      [0, 1, 2].map((ref) => {
        const file = `midisf/acoustic_grand_piano/${refmidi + ref}v${vel}.pcm`;
        execSync(`ffmpeg ${qclause} -i /Users/yisheng/Documents/GitHub/ssr-bach/48khz24bit/${note}${octave}v${vel}.wav -af atempo=${Math.pow(
          2,
          ref / 12
        )} -f f32le ${file}`)
        //  process.exit();
      });
    });
  });

  let aa = "A0";


};
if (process.argv[2]) {
  installNotesFromCsv(process.argv[2]);
} else {
  installNotesFromCsv("./midi/song.mid");
}
// installPiano(1);
// installPiano(16);
// installPiano(5);