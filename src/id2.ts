import { spawn } from "child_process";
import { existsSync } from "fs";
import { notelist } from "./filelist";

export const handleSamples = ({ who, parts }, res): void => {
  const instment = parts[2];
  const note = parts[3];
  console.log(parts);
  if (parts[3] && existsSync("./midisf/" + instment + "/" + note + ".pcm")) {
    res.writeHead(200, { "Content-Type": "audio/mp3" });
    const proc = spawn(
      "ffmpeg",
      `-f f32le -ar 48000 -ac 1 -i ${
        "./midisf/" + instment + "/" + note + ".pcm"
      } -f mp3 -`.split(" ")
    );
    proc.on("error", (d) => console.error(d.toString()));
    proc.stdout.pipe(res);
  } else {
    res.writeHead(200, {
      "Content-Type": "text/HTML",
      "set-cookie": "who=" + who,
    });

    notelist(res);
  }
};
