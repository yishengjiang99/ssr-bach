import { createWriteStream, readdir, readFile } from "fs";
import { readdirSync } from "fs";
import { basename } from "path";
import { Writable } from "stream";
import { execSync } from "child_process";
import { readAsCSV } from "./read-midi-sse-csv";
import { installNotesFromCsv } from "./install";
export const midifiles = readdirSync("./midi");

export const fileRow = (item) => {
  return `
  <ul>${item.name}<a class='mocha' href="/pcm/${item.name}"> read</ul>
 
`;
};

export const renderListStr = (who: string) =>
  `<ul>
${midifiles.map(
  (item) =>
    `<li>${item}<a class='mocha' href="/pcm/${item}?who=${who}"> read</a></li>`
)}
</ul>`;

export const renderlist = async (res: Writable, who: string) => {
  res.write("<div>");

  midifiles
    .filter((item) => {
      return item.endsWith("mid");
    })
    .map((item) =>
      res.write(
        `<ul><a class='mocha' href="/pcm/${item}?cookie=${who}}">${item} read</a></ul>`
      )
    );
  res.write("</div>");
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
