import { execSync } from "child_process";
import { existsSync } from "fs";
import { createServer } from "http";
import { resolve, dirname } from "path";
import { handlePost, dbfsroot } from "./fsr";

// test("handlePost", () => {
//   expect(dbfsroot).toBe(resolve(__dirname, "../dbfs"));
//   expect(dirname("/ddd/gggg.js")).toBe("/ddd");

//   const resp = execSync(
//     "curl -X POST localhost:3333/dbfs/me/sss/s.js -d 'adfdafd'"
//   ).toString();

//   expect(existsSync(resolve(dbfsroot, "me/sss/s.js"))).toBe(true);
// });

createServer((req, res) => {
  handlePost(req, res, "me");
}).listen(3333);
