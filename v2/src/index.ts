import { SF2File } from "./sffile";
import { loadMidi } from "./load-midi";
import { PassThrough, Writable } from "stream";

import { cspawn } from "./cspawn";
import { ffp } from "./ffp";
const ffpath = require("path").resolve(__dirname, "../ffplay");

function go() {
  const pt = new PassThrough();
  loadMidi(
    process.argv[2] || "./song.mid",
    new SF2File(process.argv[3] || "file.sf2", 24000),
    pt,
    24000
  ).loop();
  //process.nextTick(() => cspawn(`od -f`, [pt, process.stdout, process.stderr]));

  process.nextTick(() =>
    cspawn(`${ffpath} -i pipe:0 -ac 1 -ar 24000 -f f32le`, [
      pt,
      process.stdout,
      process.stderr,
    ])
  );
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
    cspawn(`${ffpath} -i pipe:0 -ac 1 -ar 24000 -f f32le`, [
      pt,
      process.stdout,
      process.stderr,
    ])
  );
}

///mike_check();
go(); //
