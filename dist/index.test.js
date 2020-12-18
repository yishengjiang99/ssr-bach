"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
describe("this system", () => {
    it("listens on public port", (done) => {
        child_process_1.execSync("curl https://www.grepawk.com/bach").toString();
        done();
    });
    // it("respond with a list of midis at ", () => {
    //   const resp = execSync("curl -I https://www.grepawk.com/bach/rt").toString();
    //   expect(resp).to.contain("event-stream");
    // });
    // it("responses with a listw of midifiles at /bach/midi", () => {
    //   const call = execSync(
    //     "curl -s https://www.grepawk.com/bach/list"
    //   ).toString();
    //   expect(JSON.parse(call).length).gt(0);
    // });
    // it("api for playing notes", () => {
    //   const stdout = execSync(
    //     "curl `https://www.grepawk.com/bach/C4.mp3` -o -|ffmpeg -i pipe:0"
    //   );
    //   // expect(FFT(stdout)[0] - 440).lt(30);
    // });
});
//# sourceMappingURL=index.test.js.map