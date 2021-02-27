import { SF2File } from "./sffile";
import { loadMidi } from "./load-midi";
import { Writable } from "stream";
import { ffp } from "./ffp";
import { execSync } from "child_process";
import { createWriteStream } from "fs";
import { cspawn } from "./cspawn";
export async function playMidi(output: Writable, midiFile: string, sf2file: string = "./file.sf2"): Promise<void> {
  const sf = new SF2File(sf2file, 24000);

  const readDone = loadMidi(midiFile, async function (notes) {
    for (const { note, track } of notes) {
      const info = sf.keyOn(
        {
          bankId: track.instrument.percussion ? 128 : 0,
          presetId: track.instrument.number,
          key: note.midi,
          vel: note.velocity * 0x7f,
        },
        note.duration,
        track.channel
      );
      // const { sample, attributes, adsr } = info;
    }
    await new Promise((resolve) => {
      setTimeout(resolve, 2.5);
    });
    return 0.0025;
  });

  const fps = 24000 / 128;
  const timer = setInterval(() => {
    const res = sf.render(128);
    output.write(res);
  }, 1000 / fps);

  readDone
    .then(() => {
      clearInterval(timer);
      output.end();
    })
    .catch((e) => {
      console.error(e);
    });
}

// require("http")
//   .createServer((req, res) => {
//     let m = req.url.match(/\/(\d+).wav/);
//     if (m && m[1]) {
//       res.writeHead(200, { "content-type": "sound/wav" });
//       cspawn(`nc localhost -p ${m[1]}`).stdout.pipe(res);
//       return;
//     }
//     const session = "8442";

//     res.writeHead(200, { "content-type": "text/html" });
//     res.write(`<html><body><audio controls src='${session}.wav'>go</audio></body></html>`);

//     const sp1 = cspawn(`ffmpeg -f f32le -ac 1 -ar 24k -i pipe:0 -f WAV tcp://localhost:85555`);
//     // const sp2 = cspawn(`nc -l ${session}`);
//     // sp1.stdout.pipe(sp2.stdin);
//     playMidi(sp1.stdin, process.argv[2] || "song.mid");
//     res.end();
//   })
//   .listen(3000);

playMidi(cspawn(`ffplay -i pipe:0 -ac 1 -ar 24k -f f32le`).stdin, process.argv[2] || "song.mid");
