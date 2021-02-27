import { initGo } from "./run";
import { sffile } from "./sffile";
import { Zone } from "./sf.types";

const { sdta, findPreset } = sffile("./file.sf2");
initGo(sdta.data, sdta.sectionSize / 2)
  .then(({ noteOn, render }) => {
    const zone: Zone = findPreset({ bankId: 0, presetId: 33, key: 55, vel: 55 });
    const { start, end, startLoop, endLoop, originalPitch, sampleRate } = zone.sample;
    const ratio = (Math.pow(2, (originalPitch - 44) / 12) * sampleRate) / 48000;
    noteOn(zone.sample, 55, 0.25, 0);
    noteOn(zone.sample, 46, 0.25, 1);
    noteOn(zone.sample, 55, 1.25, 2);

    // const output = ffp({ ac: 1, format: "f32le", ar: 48000 });
    for (let i = 0; i < 48000; i += 128) {
      process.stdout.write(render(128));
    }
    //ffp({ ac: 1, format: "f32le", ar: 48000 }).write(buffer);
  })
  .catch((e) => {
    console.error(e);
  });
