const { expect } = require("chai");
const { exec, execSync } = require("child_process");
const { readdirSync } = require("fs");

describe("install.js", () => {
  it.skip("downloads pieces of music", () => {
    execSync("node dist/install.js ./Beethoven-Symphony5-1.csv");
    expect(execSync("ls midisf/*/*pcm|wc -l").toString().trim()).to.equal(
      execSync(`cat Beethoven-Symphony5-1.mid.csv |cut -d',' -f1,2|sort|uniq |wc -l`).toString().trim()
    );
  }).timeout(125555);
});
