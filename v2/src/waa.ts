import { Envelope } from "ssr-cxt";
import { chart } from "./chart";
import { ffp } from "./ffp";
import { SF2File } from "./sffile";
import { keys88 } from "./utils";
const fs = new SF2File("./file.sf2", 21000);
var babar = require("babar");

fs.key(keys88.indexOf("Bb3"));
fs.key(keys88.indexOf("C3"));
fs.key(keys88.indexOf("D3"));

const ob = fs.render(21000 / 4);
const ff = new DataView(ob.buffer); //slice(0, 10);
const fff = new Float32Array(ff.buffer);

console.log(
  babar(
    fff.reduce((arr, v, i) => {
      arr.push([i, v]);
      return arr;
    }, []),
    {
      minY: -0.5,
      maxY: 0.5,
      yFractions: 0.0001,
    }
  )
);
const ffff = new SF2File("./file.sf2", 24000);
console.log(ffff.sections.pdta.data[0][4]

// [0].map((preset) => {
//   preset.zones.map((z) => {
//     console.log(z.adsr);
//   });
// });
