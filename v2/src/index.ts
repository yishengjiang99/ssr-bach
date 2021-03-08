import { SF2File } from "./sffile";
import { createServer } from "http";
import { generatorNames, generators } from "./sf.types";
import { envAmplitue } from "./envAmplitue";
import { loadMidi } from "./load-midi";
import { ffp } from "../../junk/src/sinks";
import { createReadStream, existsSync, readdir, readdirSync } from "fs";
import { resolve } from "path";
import { LUT } from "./LUT";
const sf = new SF2File(process.argv[3] || "file.sf2", 48000);
const { presets, shdr, inst } = sf.sections.pdta;
const tones = Object.values(presets[0]);
const drums = Object.values(presets[128]);

const loops = [];
createServer((req, res) => {
  let m;
  const ticksperpage = 30 * 4 * 255;
  if ((m = req.url.match(/midi\/(.*)/))) {
    const { tracks, header, loop } = loadMidi(
      resolve("midi", decodeURIComponent(m[1])),
      sf,
      res,
      48000
    );
    // .loop();
    loops.push({ tracks, loop, header });
    const loopId = loops.length - 1;
    res.writeHead(206, { contentType: "application/json" });
    return res.end(
      JSON.stringify({
        notes: tracks
          .filter((t) => t.notes.length)
          .map((t) => [t.instrument.name, ...t.notes]),
        tracks: tracks
          .filter((t) => t.notes.length)
          .map((t) =>
            t.notes
              .filter((n) => n.ticks <= ticksperpage)
              .map((n) =>
                sf.findPreset({
                  bankId: t.channel == 9 ? 128 : 0,
                  presetId: t.instrument.number,
                  key: n.midi,
                  vel: n.velocity * 0x7f,
                })
              )
          ),
        next: `/tracks/${loopId}/page/2`,
        play: `/tracks/${loopId}/play`,
        loopId,
        header,
      })
    );
  } else if ((m = req.url.match(/tracks\/(\d+)\/page\/(\d+)/))) {
    const { tracks, header, loopId } = loops[m[1]];
    const page = m[2];

    if (loops[m[1]]) return res.end("HTTP/1.1 404 Not founD");
    if (header.durationTicks > (page + 1) * ticksperpage)
      res.writeHead(200, { contentType: "application/json" });
    else {
      res.writeHead(206, { contentType: "application/json" });
    }
    const paginate = (n) =>
      n.ticks > ticksperpage * page && n.ticks < ticksperpage * (page + 1);
    return res.end(
      JSON.stringify({
        page: tracks.map((t) => t.notes.filter((n) => paginate(n))),
        next: `/tracks/${loopId}/page/${page + 1}`,
        loopId,
      })
    );
  } else if ((m = req.url.match(/tracks\/(\d+)\/play/))) {
    const { loop } = loops[m[1]];
    res.writeHead(200, { contentType: "audio/raw" });
    loop();
  } else if ((m = req.url.match(/sample\/(\d+)\/(\d+)\/(\d+)\/(\d+)/))) {
    const [_, bankId, presetId, key, vel] = m;

    sf.keyOn({ bankId: bankId, presetId, key, vel }, 0.5, 0);

    res.writeHead(200, { "Content-Type": "audio/raw" });
    res.end(sf.render(48000));
    return;
    //res.end();
  } else if ((m = req.url.match(/env\/(.*?)\/(.*?)\/(.*?)\/(.*?)\/(.*?)/))) {
    //(\d+)\/(\d+)\/(\d+)\/(\d+)/))) {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.write(`<!DOCTYPE html>`);
    m = m.shift();
    const [delay, a, hol, decay, release] = m;
    const g = envAmplitue([delay, a, hol, decay, release], 1000, 48000);
    let c = 0;
    while (c++ < 100) {
      let n = g.next();
      if (n.done) break;
      res.write(n.value);
    }
    res.end();
    return;
  } else if ((m = req.url.match(/preset\/(\d+)\/(\d+)/))) {
    res.write("<table border=1>");
    res.write(
      `<tr><td>
        ${`attack,decay,sustain,release,krange,vrange,attentuation,pan,pitch,samplerate,tuning`
          .split(",")
          .join("</td><td>")}
      </td></tr>`
    );
    const { fineTune, coarseTune, overridingRootKey } = generators;
    const bank = sf.sections.pdta.presets[m[2]];
    [bank[m[1]].defaultBag]
      .concat(bank[m[1]].zones)
      .filter((z) => z && z.keyRange && z.velRange)
      .map((z) => {
        const envUrl = `/env/${z.misc.envelopPhases.join("/")}`;
        const playFn = `playSample("/sample/${m[2]}/${m[1]}/${z.keyRange.hi - 5}/${
          z.velRange.lo + 5
        }")`;
        res.write(`<tr><td>
        
      ${[
        ...z.misc.envelopPhases,
        Object.values(z.keyRange).join("-"),
        Object.values(z.velRange).join("-"),
        LUT.cent2amp[z.attenuation],
        z.pan,

        z.generators[overridingRootKey]?.amount || z.sample?.originalPitch,
        z.sample?.sampleRate,
        z.sample?.name,

        [fineTune, coarseTune]
          .map((opr) => (z.generators[opr] && z.generators[opr].signed) || "-")
          .join("|"),
      ].join("</td><td>")}</td>
        ${
          z.sample &&
          `<td><a class='smpl' href='#' onclick='${playFn}'>play ${z.keyRange.lo}</a></td>`
        }<td>    ${
          z.sample &&
          `<td><button type='button' class='btn btn-small' data-bs-toggle="popover" data-bs-content="sc" data-href='${envUrl}'>envlope</a></td>`
        }
        </tr>`);
      });
    res.end("</table>");
    return;
  } else if (req.url.match("/js/(.*?)")) {
    if (!existsSync(resolve("rc", req.url.split("/")[2]))) res.writeHead(404);
    createReadStream(resolve("rc", req.url.split("/")[2])).pipe(res);
  } else if (req.url.match("/bootstrap.min.css")) {
    createReadStream("./bootstrap.min.css").pipe(res);
  } else {
    res.writeHead(200, { "Content-Type": "text/html" });

    res.end(/* html */ `<!doctype html5><html>
    <head>
    <link href="bootstrap.min.css" rel="stylesheet">
    <script src="https://unpkg.com/react@17/umd/react.production.min.js" crossorigin></script>
<script src="https://unpkg.com/react-dom@17/umd/react-dom.production.min.js" crossorigin></script>  
    </head>
    <body class='container row'>
      <aside class='col-md-3'>
      <ul class="list-group" style='max-height:30vh;overflow-y:scroll'>
        ${readdirSync("midi/").map(
          (file) =>
            `<li class='list-group-item'><a class='midi' href='/midi/${encodeURIComponent(
              file
            )}'>${file}</li>`
        )}
      </ul>
    <ul class="list-group" style='max-height:30vh;overflow-y:scroll'>
    ${Object.values(tones)
      .map(
        (p) => `<li class='list-group-item'>
      <div>${p.name} (${p.zones.length}) <a class='nav' href="/preset/${p.presetId}/${p.bankId}">go</a></div> </li>`
      )
      .join("")}</ul>    
      <ul class="list-group" style='max-height:30vh;overflow-y:scroll'>
      ${Object.values(drums)
        .map(
          (p) => `<li class='list-group-item'>
        <div>${p.name} (${p.zones.length}) <a class='nav' href="/preset/${p.presetId}/${p.bankId}">go</a></div> </li>`
        )
        .join("")}</ul>
    </aside>
    <main id='root' class='col-md-3'></main><span id='like_button_container'></span>
    
    <script src='js/component.js'></script>
    <script src='js/player.js'></script>

    <script>
     ${javascript}
    </script>`);
  }
}).listen(3000);

const javascript = /* javascript */ `
const main =document.querySelector("main");
for(const a of document.querySelectorAll("a.nav")){
  a.addEventListener("click", function(e){
    e.preventDefault();
    fetch(e.target.href).then(res=>{
      res.text().then(html=>{
        main.innerHTML=html;
      })
    }).catch(e=>alert(e.message));
})
}
for(const a of document.querySelectorAll("a.midi")){
  a.addEventListener("click", function(e){
    e.preventDefault();
    fetch(e.target.href).then(res=>{
      res.json().then(({tracks,header,page})=>{
       rendertracks({tracks,header,page})
      })
    });
})
}
let ctx;
async function playSample(uri,e ){
if(!ctx) ctx= new AudioContext();
const resp = await fetch(uri);
const ab = await resp.arrayBuffer();
const dv = new DataView (ab);
const audb= ctx.createBuffer(2, ab.byteLength / 8, 48000);
const buffer = [audb.getChannelData(0), audb.getChannelData(1)];
for (let i = 0; i < audb.length; i++) {
    buffer[0][i] = dv.getFloat32(i*2 * 4+4, true);
    buffer[1][i] = dv.getFloat32(i *2* 4, true);
}
const abs = new AudioBufferSourceNode(ctx, { buffer: audb });
abs.connect(ctx.destination);
abs.start();
}`;
process.on("uncaughtException", (e) => {
  console.error("NOTICE:", e);
});
