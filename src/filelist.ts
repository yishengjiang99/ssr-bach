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

export const csvprep = () =>
  execSync("ls midi/*")
    .toString()
    .trim()
    .split("\n")
    .map((f) => {
      try {
        readAsCSV(f, true).pipe(
          createWriteStream("./csv/" + basename(f) + ".csv")
        );
      } catch (e) {
        console.log(f);
        execSync(`mv ${f} junk`);
        return;
      }
      return "./csv/" + basename(f) + ".csv";
    })
    .map((csv, i) => {
      setTimeout(() => {
        installNotesFromCsv(csv, "FatBoy");
      }, i * 20000);
    });
csvprep();
export const fileRow = (item) => {
  return `
  <tr>
  <td>${item.name}</td><td>${item.name}</td>
  <td><a class='mocha' href="/bach/pcm/${item.name}"> read</a>
  <a class='opts' href="/edit/${item.name}"> edit</a>
  </td>
  </tr>`;
};

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
    res.write("<div class='mt-25'></div>");
    res.write(`<div><span>${section}</span>
    ${links.map((n) => {
      const nn = n.replace("48000-mono-f32le-", "").replace(".pcm", "");
      return `<a href="/bach/notes/${section}/${nn}"> ${nn} </a>`;
    })}
    </div>`);
  }
  res.write(`
     <style>
     .mt-25{
       margin-top:25px;
     }
     body{
       background-color:black;
       color:white;
       
     }
     a{
       color:white;
     }
     canvas{
       top:0;left:0;
       z-index:-2;
    position:absolute;
    width:100vw;
    height:100vh;
  }</style>
  <script type='module' src='/js/playsample.js'></script>`);
};
