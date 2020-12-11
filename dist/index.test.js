"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const load_sort_midi_1 = require("./load-sort-midi");
describe("this system", () => {
    it("listens on public port", (done) => {
        child_process_1.execSync("curl -I https://api.grepawk.com/bach").toString();
        const file = "./Beethoven-Symphony5-1.mid";
        load_sort_midi_1.convertMidi(file, {
            output: process.stdout,
            realtime: false,
        }).then(() => {
            done();
        });
    });
    it("respond with a list of midis at ", () => {
        child_process_1.execSync("curl -I https://api.grepawk.com/list").toString();
    });
});
//# sourceMappingURL=index.test.js.map