import { initGo } from "./run";
import { sffile } from "./sffile";
import { Zone } from "./sf.types";
import { ffp } from "./ffp";

const { sdta, getSample } = sffile("./file.sf2");
initGo(sdta.data, sdta.sectionSize / 2)
  .then(({ noteOn, render }) => {
    const zone: Zone = getSample(0, 0, 44, 33);

    const { start, end, startLoop, endLoop, originalPitch, sampleRate } = zone.sample;
    const ratio = (Math.pow(2, (originalPitch - 44) / 12) * sampleRate) / 48000;
    noteOn(start, end, startLoop, endLoop, originalPitch, 0, ratio);
    const buffer = render(48000);
    ffp({ ac: 1, format: "f32le", ar: 48000 }).write(buffer);
  })
  .catch((e) => {
    console.error(e);
  });
