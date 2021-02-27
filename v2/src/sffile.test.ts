import test from "ava";
import { SF2File } from "./sffile";

// test("parse sf2 file", (t) => {
//   const fff = new SF2File("./file.sf2");
//   const zone = fff.findPreset({ bankId: 0, presetId: 0, vel: 50, key: 41 });
//   t.log(zone.generators);
//   console.log(zone.generators);
//   t.truthy(fff.sections.pdta.data[0]);
//   t.truthy(fff.sections.pdta.data[128]);
// });
const fff = new SF2File("./file.sf2");
let zone = fff.findPreset({ bankId: 0, presetId: 0, vel: 50, key: 41 });
zone = fff.findPreset({ bankId: 0, presetId: 0, vel: 50, key: 45 });

console.log(zone);
