"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const path_1 = require("path");
const fsr_1 = require("./fsr");
test("handlePost", () => {
    expect(fsr_1.dbfsroot).toBe(path_1.resolve(__dirname, "../dbfs"));
    expect(path_1.dirname("/ddd/gggg.js")).toBe("/ddd");
    const resp = child_process_1.execSync("curl -s -X POST localhost:3333/dbfs/me/sss/s.js -d 'adfdafd'").toString();
    expect(fs_1.existsSync(path_1.resolve(fsr_1.dbfsroot, "me/sss/s.js"))).toBe(true);
});
// createServer((req, res) => {
//   handlePost(req, res, "me");
// }).listen(3333);
