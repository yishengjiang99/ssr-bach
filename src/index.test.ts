import { isMainThread } from "worker_threads";

describe("this system", () => {
  it("listens on public port", () => {
    execSync("curl -I https://api.grepawk.com/bach").stdout;
  });

  it("respond with a list of midis at ", () => {
    execSync("curl -I https://api.grepawk.com/list").stdout;
  });
});
