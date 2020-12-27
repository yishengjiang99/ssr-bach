import { createWriteStream } from "fs";
import { readdirSync } from "fs";
import { basename } from "path";
import { Writable } from "stream";
import { execSync } from "child_process";
import { readAsCSV } from "./read-midi-sse-csv";
import { installNotesFromCsv } from "./install";
export const midifiles = execSync("ls midi/*")
  .toString()
  .trim()
  .split("\n")
  .filter((n) => n);

export const fileRow = (item) => {
  return `
  <tr>
  <td>${item.name}</td><td>${item.name}</td>
  <td><a class='mocha' href="/bach/pcm/${item.name}"> read</a>
  <a class='opts' href="/edit/${item.name}"> edit</a>
  </td>
  </tr>`;
};

export const renderListStr = () =>
  `<table>
${midifiles.map((item) => fileRow({ name: basename(item) }))}
</table>`;
console.log(renderListStr());
export const renderlist = async (res: Writable) => {
  res.write("<table>");

  midifiles
    .filter((item) => {
      return item.endsWith("mid");
    })
    .map((item) => res.write(fileRow({ name: basename(item) })));
  res.write("</table>");
};

export const notelist = (res: Writable) => {
  const sections = readdirSync("./midisf");

  for (const section of sections) {
    const links = readdirSync("midisf/" + section).filter((n) =>
      n.endsWith(".pcm")
    );

    res.write(`<tr><td>${section}</td>`);
    res.write(`
    ${links.map((n) => {
      const nn = n.replace("48000-mono-f32le-", "").replace(".pcm", "");
      return `<td><a class="samples" href="/bach/notes/${section}/${nn}"> 1${nn} </a></td>`;
    })}</td>`);
  }
  res.write(`</table>`);
};
