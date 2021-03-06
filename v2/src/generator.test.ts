import test from "ava";
import { execSync } from "child_process";
import { LUT } from "./generators";
import { parsePDTA, hydra, readPDTA } from "./pdta";
import { reader } from "./reader";
import { SF2File } from "./sffile";

const sf2 = new SF2File("./fixtures/Stratocaster.sf2");
const pdtaoffset = execSync("strings -o fixtures/Stratocaster.sf2|grep pdta")
  .toString()
  .trim()
  .split(/S+/)[0];
const nitoff = parseInt(pdtaoffset);
const r = reader("file.sf2");
r.setOffset(nitoff);
const pd = readPDTA(r);
console.log(hydra);
// r.setOffset(nitoff);
// let size = r.get32();
// test("generator lookuptables", (t) => {
//   LUT.init();
//   t.truthy(LUT.absTC[0]);
//   t.true(LUT.absTC[0] - 0.001 < 0.001);
//   t.true(LUT.absTC[1] - LUT.absTC[0] < LUT.absTC[2] - LUT.absTC[0]);
// });
