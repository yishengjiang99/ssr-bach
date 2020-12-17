import { expect } from "chai";
import { convertMidi } from "./load-sort-midi";
describe("convermidi", () => {
  it("loads .mid and produces note events", () => {
    const convert = convertMidi("./song.mid", true);
    convert.emitter
      .on("#time", (d) => {
        console.log(d, process.uptime());
      })
      .on("note", console.log);
  });
});
