import test from "ava";
import { assert } from "console";
import { createWriteStream } from "fs";
import { Envelope } from "./envelope";
import { ffp } from "./ffp";
import { SF2File } from "./sffile";

test("parse sf2 file", (t) => {
  const fff = new SF2File("./file.sf2");
  const zone = fff.findPreset({ bankId: 0, presetId: 0, vel: 50, key: 41 });

  t.truthy(fff.sections.pdta.data[0]);
  t.truthy(fff.sections.pdta.data[128]);
});

test("envelop", (t) => {
  const fff = new SF2File("./file.sf2");
  const zone = fff.findPreset({ bankId: 0, presetId: 0, vel: 50, key: 41 });

  t.truthy(zone.adsr);
  //new Envelope()
});

test("render", (t) => {
  const fff = new SF2File("./file.sf2", 24000);
  const sink = ffp({ ac: 1, ar: 24000 });

  for (let i = 21; i < 55; i++) {
    fff.key(i);
    sink.write(fff.render(24000 / 4));

    t.assert(fff.channels[0].length < 120);
  }

  //new Envelope()
});
