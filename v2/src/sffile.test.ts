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
  const fff = sffile("./file.sf2");

  const zone = fff.getSample(0, 0, 44, 55);

  t.truthy(zone);
  t.true(zone.velRange.lo <= 55);
  t.true(zone.velRange.hi >= 55);
  t.true(zone.keyRange.hi >= 44);
});
