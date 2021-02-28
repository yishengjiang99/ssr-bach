import test from "ava";
import { assert } from "console";
import { Envelope } from "ssr-cxt";
import { SF2File } from "./sffile";
import { keys88 } from "./utils";
const fs = new SF2File("./file.sf2", 21000);
test("envelopes are no weird", (t) => {
  for (let pid = 0; pid < 90; pid++) {
    [26, 44, 55, 44].map((key) => {
      const z = fs.findPreset({ bankId: 0, presetId: pid, vel: 40, key });
      t.not(z.adsr[0], NaN);
      t.not(z.adsr[1], NaN);
      t.not(z.adsr[3], NaN);
      const [a, d, s, r] = z.adsr;
      const env = new Envelope(1000, [a, d, s, r]);
      let steps = 1000;
      while (steps--) {
        if (env.shift() > 1.07) {
          t.fail(
            "env should not over 1.0---- " + env.adsr.join(",") + " next " + env.shift() + " " + env.deltas.join("--")
          );
          break;
        }
        if (env.shift() < 0.0) {
          t.fail("env should be less than 0 " + env.adsr.join(","));
          break;
        }
      }
    });
  }
});

test("render one voice at time", (t) => {
  var babar = require("babar");

  fs.key(keys88.indexOf("Bb3"));
  const ob = fs.render(21000 / 4);
  t.truthy(ob);
});

test("three nodes at time", (t) => {
  const fs = new SF2File("./file.sf2", 21000);

  fs.key(keys88.indexOf("Bb3"));
  fs.key(keys88.indexOf("C3"));
  fs.key(keys88.indexOf("D3"));

  const ob = fs.render(21000 / 4);
  const ff = new DataView(ob.buffer); //slice(0, 10);
  const fff = new Float32Array(ff.buffer);
  t.is(fff.length, 21000 / 4);
  console.log(fff.filter((f) => f > 1.0));

  t.true(fff.every((f) => f <= 1.0));
});

test("every note is not NaN", (t) => {
  const fs = new SF2File("./file.sf2", 21000);

  fs.key(keys88.indexOf("Bb3"));
  fs.key(keys88.indexOf("C3"));
  fs.key(keys88.indexOf("D3"));

  const ob = fs.render(21000 / 4);
  const ff = new DataView(ob.buffer); //slice(0, 10);
  const fff = new Float32Array(ff.buffer);
  t.is(fff.length, 21000 / 4);
  t.true(fff.every((f) => !isNaN(f)));
});

test("every reset envelope is not weird", (t) => {
  const fs = new SF2File("./file.sf2", 21000);

  Object.values(fs.sections.pdta.data[0]).map((pd) => {
    pd.zones.map((z) => {
      t.assert(z.adsr.every((v) => !isNaN(v)));
      const env = new Envelope(21000, z.adsr);
      assert(env.tau > 0);
    });
  });
});
