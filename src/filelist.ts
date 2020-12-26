import { createWriteStream } from "fs";
import { listContainerFiles, wsclient } from "grepupload";
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
console.log("midifiles", midifiles);
export const syncAZfs = () => {
  const links = listContainerFiles("midi").then((files) => {
    const blobitems = files
      .filter((item) => {
        return item.name.endsWith("mid");
      })
      .map((item) => {
        const blobc = wsclient()
          .getContainerClient("midi")
          .getBlobClient(item.name)
          .download()
          .then((resp) => {
            resp.readableStreamBody.pipe(
              createWriteStream("./midi/" + item.name)
            );
          });
      });
  });
};

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

//fileRow(process.stdout);
