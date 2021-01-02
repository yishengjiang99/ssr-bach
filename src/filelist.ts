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

export const notelist = (res: Writable, format = "pcm") => {
  const sections = readdirSync("./midisf");

  for (const section of sections) {
    const links = readdirSync("midisf/" + section).filter((n) =>
      n.endsWith(".pcm")
    );
    res.write("<div class='mt-25'></div>");
    res.write(`<div><span>${section}</span>
      ${links.map((n) => {
        const nn = n.replace("48000-mono-f32le-", "").replace(".pcm", "");
        return `<a class='samples' href="/${format}/${section}/${nn}.${format}"> ${nn} </a>`;
      })}
      </div>`);
  }
  res.write(/* html */ `
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
    <script type='module'>
    import {AnalyzerView} from './js/build/analyserView.js';
    let ctx, gainNode, av;
    document.querySelectorAll(".samples").forEach(
      (a) =>
        (a.onclick = async (e) => {
          const url = a.href;
          e.preventDefault();
          if (!ctx) ctx= new AudioContext();
          const dv = await fetch(url)
            .then((resp) => resp.blob())
            .then((blob) => blob.arrayBuffer())
            .then((ab) => new DataView(ab))
            .catch(console.log);
          if (!dv) return;
          const audb = ctx.createBuffer(2, dv.buffer.byteLength / 4, 48000);
          const buffer = audb.getChannelData(0);
          for (let i = 0; i < audb.length; i++) {
            buffer[i] = dv.getFloat32(i * 4, true);
          }
          const abs = new AudioBufferSourceNode(ctx, { buffer: audb });
          abs.connect(ctx.destination);
          abs.starrst();
        })
    );
    const init = () => {
      ctx = new AudioContext();
      gainNode = new GainNode(ctx);
    
    };</script>`);
};
