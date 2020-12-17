const execSync = require("child_process").execSync;
const { existsSync, createWriteStream, readFileSync } = require("fs");
const { execFile, exec } = require("child_process");
const sfUrl = (setname, fontname) =>
  `https://gleitz.github.io/midi-js-soundfonts/${setname}/${fontname}-mp3.js`;

const format = (str) =>
  str
    .replace(" ", "_")
    .replace(" ", "_")
    .replace(" ", "_")
    .replace(" ", "_")
    .replace("(", "")
    .replace(")", "")
    .trim();

const csvfile = process.argv[2] || "";

const setname = process.argv[3] || "FatBoy";

const mkfolder = (folder) => existsSync(folder) || execSync(`mkdir ${folder}`);
"midisf,db,csv,mp3".split(",").map((f) => f && mkfolder(f));

export const installNotesFromCsv = (csvfile) => {
  for (const name of execSync(
    "cat " + csvfile + "|grep -v '#'|cut -f6 -d','|sort |uniq"
  )
    .toString()
    .trim()
    .split("\n")) {
    const fontname = format(name).replace("\t", "");
    if (!fontname) continue;
    const localname = "mp3/" + setname + "_" + fontname + ".js";
    if (!existsSync(localname)) {
      execSync(
        `curl -s "${sfUrl(
          setname,
          fontname
        )}" -o - |grep 'data:audio/mp3;base64,' |awk -F 'data:audio/mp3;base64,' '{print $2}'|tr '\"\n,' '\n'| grep -v ^$ |base64 --decode > ${localname}`
      );
    }

    mkfolder(`midisf/${fontname}`);
    const byteswrote = parseInt(
      execSync("wc -c " + localname)
        .toString()
        .trim()
        .split(/\s+/)[0]
    );
    const bytesPerNote = byteswrote / 88;
    const uniqnotes = execSync(
      `grep ${fontname} ${csvfile} |grep -v '#'|cut -f2 -d','|sort |uniq`
    )
      .toString()
      .trim()
      .split("\n");
    for (const midi of uniqnotes) {
      if (!midi) continue;
      mkfolder(`midisf/${fontname}`);
      const index = midi - 21;
      const pcmname = `midisf/${fontname}/${index}.pcm`;
      console.log(pcmname);
      try {
        console.log(
          `dd if=${localname} bs=${bytesPerNote} skip=${index} count=1 of=pipe:1|ffmpeg -y -hide_banner -loglevel panic -f mp3 -i pipe:0 -f f32le -ac 1 -ar 48000 ${pcmname}`
        );
        exec(
          `dd if=${localname} bs=${bytesPerNote} skip=${index} count=1 |ffmpeg -y -hide_banner -loglevel panic -f mp3 -i pipe:0 -f f32le -ac 1 -ar 48000 ${pcmname}`
        );
      } catch (e) {
        console.log(e);
      }
    }
  }
};
// installNotesFromCsv("/home/AzureUser/ssr-bach/csv/serenade_k361_3rd-mid.csv");
