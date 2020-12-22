function split() {
  const { existsSync, createWriteStream, readFileSync } = require("fs");
  const { execFile, execSync, exec } = require("child_process");
  const mkfolder = (folder) =>
    existsSync(folder) || execSync(`mkdir ${folder}`);

  const fontname = process.argv[2];
  mkfolder(`midisf/${fontname}`);

  const localname = "mp3/FatBoy_" + fontname + ".js";
  const byteswrote = parseInt(
    execSync("wc -c " + localname)
      .toString()
      .trim()
      .split(/\s+/)[0]
  );
  const bytesPerNote = byteswrote / 88;

  for (let index = 0; index < 88; index++) {
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
