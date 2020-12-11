const execSync = require("child_process").execSync;
const { existsSync, createWriteStream, readFileSync } = require("fs");
const { execFile, exec } = require("child_process");
const sfUrl = (setname, fontname) =>
  `https://gleitz.github.io/midi-js-soundfonts/${setname}/${fontname}-mp3.js`;
const format = (str) =>
  str.replace(" ", "_").replace(" ", "_").replace(" ", "_").replace(" ", "_");

const csvfile = process.argv[2];

const setname = process.argv[3] || "FatBoy";

const mkfolder=(folder)=>existsSync(folder) || execSync(`mkdir ${folder}`); //
'midisf,db,csv,mp3'.split(",").map(f=>f && mkfolder(f));

for (const name of execSync("cat " + csvfile + " |cut -f1 -d','|sort |uniq")
  .toString()
  .trim()
  .split("\n")) {
  const fontname = format(name);
  if (!fontname) continue;
  const localname = "mp3/" + setname + "_" + fontname + ".js";
  mkfolder(`midisf/${fontname}`);
  execSync(
    `curl "${sfUrl(
      setname,
      fontname
    )}" -o - |grep 'data:audio/mp3;base64,' |awk -F 'data:audio/mp3;base64,' '{print $2}'|tr '\",' '\n'|grep -v ^$ |base64 --decode > ${localname}`
  );
  const byteswrote = parseInt(
    execSync("wc -c " + localname)
      .toString()
      .trim()
      .split(/\s+/)[0]
  );
  const bytesPerNote = byteswrote / 88;

  const uniqnotes = execSync(
    `grep ${name} ${csvfile} |cut -f2 -d','|sort |uniq|tr '\n' ','`
  )
    .toString()
    .trim()
    .split(",");
  for (const midi of uniqnotes) {
    if (!midi) continue;

    const index = midi - 21;
    const pcmname = `midisf/${fontname}/48000-mono-f32le-${index}.pcm`;
    execSync(
      `dd if=${localname} bs=${bytesPerNote} skip=${index} count=1 |ffmpeg -y -hide_banner -loglevel panic -f mp3 -i pipe:0 -f f32le -ac 1 -ar 48000 ${pcmname}`
    );
  }
}
