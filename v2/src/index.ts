import { SF2File } from "./sffile";
import { generators, Preset } from "./sf.types";
import { envAmplitue } from "./envAmplitue";
import { loadMidi } from "./load-midi";
import * as fs from "fs";
import { basename, resolve } from "path";
import { LUT } from "./LUT";
import { createSecureServer } from "http2";
import { createServer } from "http";
const sf = new SF2File(process.argv[3] || "file.sf2", 48000);
const { presets } = sf.sections.pdta;
const tones = Object.values(presets[0]);
const drums = Object.values(presets[128]);

createServer((req, res) => {
  let m;
  if ((m = req.url.match(/midi\/(.*)/))) {
    if (!fs.existsSync(resolve("midi", decodeURIComponent(m[1]))))
      return res.end("HTTP/1.1 404");
    res.write(
      "HTTP/1.1 200\r\nContent-Type:audio/raw \r\nContent-Disposition: inline \r\n\r\n"
    );
    loadMidi(resolve("midi", decodeURIComponent(m[1])), sf, res, 48000).loop();
    return;
  } else if ((m = req.url.match(/sample\/(\d+)\/(\d+)\/(\d+)\/(\d+)/))) {
    const [, bankId, presetId, key, vel] = m;

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
    const respbuf = Buffer.alloc(4000);
    let offset = 0;
    for (const amp of g) {
      respbuf.writeUInt16BE(amp, offset);
      offset += 2;
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
  } else if ((m = req.url.match(/js\/(.*)/))) {
    res.writeHead(200, { "Content-Type": "application/javascript" });
    fs.createReadStream(resolve("js", m[1])).pipe(res);
  } else if (req.url.match("/bootstrap.min.css")) {
    res.writeHead(200, { "Content-Type": "text/css" });

    fs.createReadStream("./bootstrap.min.css").pipe(res);
    return;
  } else {
    res.writeHead(200, { "Content-Type": "text/html" });

    res.write(/* html */ `
<!doctype html5>
    <html>
    <head>
    <link href="bootstrap.min.css" rel="stylesheet">
    </head>
    <body class='container row'>
      <aside class='col-md-3'>
      <ul class="list-group" style='max-height:15;overflow-y:scroll'>
         ${fs.readdirSync("midi/").map((file) => midilink(file))}


      </ul>    
      <ul class="list-group" style='max-height:15vh;overflow-y:scroll'>

      ${tones.map((p) => presetlink(p))}
          ${drums.map((p) => presetlink(p))}
      </ul>
    </aside>
    <main id='root' class='col-md-9'>
    <ul class="list-group" style='max-height:69vh;overflow-y:scroll'>
        ${fs.readdirSync("midi/").map((file) => midilink(file))}
      </ul>
      </main>
    <script src='js/playPCM.js'></script>
    <script src='js/main.js'></script>
    </body></html>`);
  }
}).listen(3000);

process.on("uncaughtException", (e) => {
  console.error("NOTICE:", e);
});
function midilink(file: string): string {
  return `<li class='list-group-item'>
  <a class='midi' href='/midi/${encodeURIComponent(file)}'>${file}</a>
  </li>`;
}

function presetlink(p: Preset): string {
  return `<li class='list-group-item'><div>${p.name} (${p.zones.length}) 
        <a class='nav' href="/preset/${p.presetId}/${p.bankId}">go</a>
        </div>
        </li>`;
}
