import { SF2File } from "./sffile";
import { loadMidi } from "./load-midi";
import { Writable } from "stream";
import { ffp } from "./ffp";

export async function playMidi(output: Writable, midiFile: string, sf2file: string = "./file.sf2"): Promise<void> {
  const sf = new SF2File(sf2file);

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

  const fps = 48000 / 128;
  const timer = setInterval(() => {
    const res = sf.render(128);
    output.write(res);
  }, 1000 / fps);

  readDone
    .then(() => {
      clearInterval(timer);
    })
    .catch((e) => {
      console.error(e);
    });
}

require("http")
  .createServer((req, res) => {
    playMidi(res, process.argv[2] || "song.mid");
  })
  .listen(3000);

//playMidi(process.stdout, process.argv[2] || "song.mid");
