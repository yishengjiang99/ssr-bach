import { execSync } from "child_process";
import { resolve } from "dns";
import { convertMidi } from "./load-sort-midi";
describe("this system", () => {
  it("listens on public port", (done) => {
    execSync("curl -I https://api.grepawk.com/bach").toString();
    const file = "./Beethoven-Symphony5-1.mid";
    convertMidi(file, {
      output: process.stdout,
      realtime: false,
    }).then(() => {
      done();
    });
  });

  it("respond with a list of midis at ", () => {
    execSync("curl -I https://api.grepawk.com/list").toString();
  });
});
