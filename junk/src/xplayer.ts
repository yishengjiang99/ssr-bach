import { execSync } from "child_process";
import { time } from "console";
import { createReadStream, readFileSync } from "fs";
import { exit } from "process";
import { std_inst_names } from "./utils";
let file = 'midi/song.mid';
const rt=execSync(`strings -o ${file}|grep -i mtrk`).toString().split("\n").map(line=>{
  return line.trim().split(" ")[0];
});


console.log(rt);
exit;