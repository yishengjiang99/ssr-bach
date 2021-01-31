import { existsSync, readdirSync, readFileSync, createWriteStream } from "fs";
import { request } from "https";
import * as zlib from "zlib";
import {DrumKitByPatchID} from '@tonejs/midi/dist/InstrumentMaps'
import { execSync, exec, execFile, execFileSync, spawnSync } from "child_process";
import { cspawn, std_inst_names } from "./utils";
import { qclause } from "./ffmpeg-templates";
import { Midi } from "@tonejs/midi";
export const installNotesFromCsv = (midiname:string, setname = "FatBoy"): void => {
  const sfUrl = (setname, fontname) =>
    `https://gleitz.github.io/midi-js-soundfonts/${setname}/${fontname}-mp3.js`;


  const mkfolder = (folder) => existsSync(folder) || execSync(`mkdir ${folder}`);
  // "midisf,db,csv,mp3".split(",").map((f) => f && mkfolder(f));
  
  new Midi(readFileSync(midiname)).tracks.map(t=>{
    console.log(process.uptime())
    t.instrument.percussion
      ? spawnSync("./installdrums", [t.instrument.number + ""])
      : spawnSync("./installsf", [t.instrument.number + ""]);
  })
  
  function installfont(fontname) {
    if (fontname === "") return;

    const localname = "mp3/" + setname + "_" + fontname + ".js";
    if (!existsSync(localname)) {
      execSync(
        `curl -S "${sfUrl(
          setname, 
          fontname
        )}" -o - |grep 'data:audio/mp3;base64,' |awk -F 'data:audio/mp3;base64,' '{print $2}'|tr '\"\n,\"' '\n'| grep -v ^$ |base64 --decode > ${localname}`
      );
    }

    mkfolder(`midisf/${fontname}`);

    const byteswrote = parseInt(
      execSync("wc -c " + localname)
        .toString()
        .trim()
        .split(/\s+/)[0]
    );
    const bytesPerNote = ~~(byteswrote / 88 / 4) * 4;

    for (let index = 0; index < 88; index++) {
      const pcmname = `midisf/${fontname}/stero-${index}.pcm`;
      try {
        if (!existsSync(pcmname)) {
          console.log(pcmname);

          execSync(
            `dd if=${localname} bs=${bytesPerNote} skip=${index} count=1 |ffmpeg -y -hide_banner -loglevel panic -f mp3 -i pipe:0 -vol 390 -f f32le -ac 2 -ar 48000 ${pcmname}`
          );
        }
      } catch (e) {
        console.log(e);
      }
    }
  }
};

export const installPiano = (vel) => {
  let midi = 1;
  let cmds = [];
  ["C", "D#", "F#", "A"].map((note, index) => {
    [1, 2, 3, 4, 5, 6, 7].map((octave) => {
      const refmidi = (octave - 1) * 12 + index * 3 + 3;
      [0, 1, 2].map((ref) => {
        const file = `midisf/acoustic_grand_piano/${refmidi + ref}v${vel}.pcm`;
        console.log(
          `ffmpeg ${qclause} -i SlenderSalamander48khz24bit/samples/${note}${octave}v${vel}.wav -af atempo=${Math.pow(
            2,
            ref / 12
          )} -f f32le ${file};`
        );
        console.log(`node_modules/grepupload/bin/upload.js ${file};`);
        //  process.exit();
      });
    });
  });

  let aa = "A0";

  [0, 1, 2].map((ref) => {
    const file = `midisf/acoustic_grand_piano/${0 + ref}v${vel}.pcm`;
    execSync(
      `ffmpeg ${qclause} -i SlenderSalamander48khz24bit/samples/${aa}}v${vel}.wav -af atempo=${Math.pow(
        2,
        ref / 12
      )} -f f32le ${file}`
    );
    console.log(`node_modules/grepupload/bin/upload.js ${file};`);
    //  process.exit();
  });
};
if (process.argv[2]) {
  installNotesFromCsv(process.argv[2]);
}else{
  installNotesFromCsv('./midi/song.mid')
}
