import { SF2File } from "./sffile";
import { loadMidi } from "./load-midi";
import { PassThrough, Writable } from "stream";

import { cspawn } from "./cspawn";
import { ffp } from "./ffp";
const ffpath = require("path").resolve(__dirname, "../ffplay");

function go() {
  const pt = new PassThrough();
  const { loop, tracks } = loadMidi(
    process.argv[2] || "./song.mid",
    new SF2File(process.argv[3] || "file.sf2", 24000),
    pt,
    24000
  );
  console.log("..and 3..");
  const noise = new Float32Array(128);
  for (let i = 0; i < 12000; i++) noise[i] = Math.random() * 2 - 1;
  pt.write(Buffer.from(noise));
  cspawn(`${ffpath} -i pipe:0 -ac 2 -ar 24000 -f f32le`, [
    pt,
    process.stdout,
    process.stderr,
  ]);
  //process.nextTick(() => cspawn(`od -f`, [pt, process.stdout, process.stderr]));
  setTimeout(() => {
    for (let i = 0; i < 12000; i++) noise[i] = Math.random() * 1.5 - 0.8;
    pt.write(Buffer.from(noise));
    console.log("..2..");
    setTimeout(() => {
      for (let i = 0; i < 12000; i++) noise[i] = Math.random() * 1.2 - 0.4;
      pt.write(Buffer.from(noise));
      console.log("..1..");
      loop();
    }, 500);
  });
}
function mike_check() {
  const sf = new SF2File(process.argv[3] || "file.sf2", 24000);

  const pt = new PassThrough();

  (async () => {
    Object.values(sf.sections.pdta.data).map((b) =>
      Object.values(b).map((p) =>
        p.zones.map((z) => {
          pt.write(
            sf.sections.sdta.data.slice(z.sample.startLoop * 4, z.sample.endLoop * 4)
          );
        })
      )
    );
  })();

  //pt.on("data", (d) => console.log(d));
  process.nextTick(() =>
    cspawn(`${ffpath} -i pipe:0 -ac 2-ar 4800 -f f32le`, [
      pt,
      process.stdout,
      process.stderr,
    ])
  );
}

///mike_check();
go(); //
