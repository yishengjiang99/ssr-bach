import test from "ava";
import { sffile } from "./sffile";

test("parse sf2 file", (t) => {
  const fff = sffile("./file.sf2");
  console.log(fff);

  t.truthy(fff.pdta.data[0]);
  t.truthy(fff.pdta.data[0][0]);

  t.truthy(fff.sdta.offset);
});

test("get sample ", (t) => {
  const { findPreset } = sffile("./file.sf2");

  const zone = findPreset({ bankId: 0, presetId: 44, vel: 33, key: 33 });
  console.log(zone);
  t.pass();
});
