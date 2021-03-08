import test from "ava";
import { SF2File } from "./sffile";

test("sffile is read", (t) => {
  const sf = new SF2File("./fixtures/Chaos.sf2");
  t.truthy(sf.sections.pdta.presets);
  t.truthy(sf.sections.pdta.shdr);
  t.truthy(sf.sections.pdta.inst);
  t.truthy(sf.sections.sdta.data);
  const t0 = Object.values(sf.sections.pdta.presets[0]);
  const pp2 = t0[0];
  t.truthy(pp2);
  for (let key = 21; key < 99; key++) {
    const z = sf.findPreset({ bankId: 0, presetId: 0, key: 55, vel: 55 });
    t.truthy(z.gain(55, 0, 0));
  }
});
