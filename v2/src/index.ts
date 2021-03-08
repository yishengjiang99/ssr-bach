import { SF2File } from "./sffile";
import { createServer } from "http";
import { generatorNames, generators } from "./sf.types";
import { envAmplitue } from "./envAmplitue";
import { loadMidi } from "./load-midi";
import { ffp } from "../../junk/src/sinks";
const sf = new SF2File(process.argv[3] || "file.sf2", 48000);
const { presets, shdr, inst } = sf.sections.pdta;
const samples = sf.sections.pdta.shdr;
const tones = Object.values(presets[0]);
createServer((req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/html",
  });
  let m;

  if ((m = req.url.match(/sample\/(\d+)\/(\d+)\/(\d+)/))) {
    const [_, presetId, key, vel] = m;

    sf.keyOn({ bankId: 0, presetId, key, vel }, 0.5, 0);

    res.writeHead(200, { "Content-Type": "audio/raw" });
    res.end(sf.render(48000));
    return;
    //res.end();
  }
  if ((m = req.url.match(/env\/(.*?)\/(.*?)\/(.*?)\/(.*?)\/(.*?)/))) {
    //(\d+)\/(\d+)\/(\d+)\/(\d+)/))) {
    res.writeHead(200, { "Content-Type": "text/plain" });
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
  }
  if ((m = req.url.match(/preset\/(\d+)/))) {
    res.write("<table border=1>");
    res.write(
      `<tr><td>
        ${`delay,attack,hold,decay,release,sustain,klo,khi,vlo,vhi,attentuation,pan,pitch,samplerate`
          .split(",")
          .join("</td><td>")}
      </td></tr>`
    );
    const { fineTune, coarseTune, overridingRootKey } = generators;
    [tones[m[1]].defaultBag]
      .concat(tones[m[1]].zones)
      .filter((z) => z && z.keyRange && z.velRange)
      .map((z) => {
        const envUrl = `/env/${z.misc.envelopPhases.join("/")}`;
        const playFn = `playSample("/sample/${m[1]}/${z.keyRange.hi - 5}/${
          z.velRange.lo + 5
        }")`;
        res.write(`<tr><td>
        
      ${[
        ...z.misc.envelopPhases,
        z.misc.sustain,
        z.keyRange.lo,
        z.keyRange.hi,
        z.velRange.lo,
        z.velRange.hi,
        z.attenuation,
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
          `<td><button type='button' class='btn btn-small' data-bs-toggle="popover" data-bs-content="s" data-href='${envUrl}'>envlope</a></td>`
        }
        </tr>`);
      });
    res.end("</table>");
    return;
  }
  res.writeHead(200, { "Content-Type": "text/html" });

  res.end(
    `<!doctype html5><html>
    <head><link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.0-beta2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-BmbxuPwQa2lc/FVzBcNJ7UAyJxM6wuqIj61tLrc4wSX0szH/Ev+nYRRuWlolflfl" crossorigin="anonymous">
    </head><body class='container row'><aside class='col-md-3'><ul><li>${Object.values(
      tones
    )
      .map((p) =>
        [
          p.name,
          p.presetId,
          p.zones.length,
          `<a class='nav' href="/preset/${p.presetId}">go</a>`,
        ].join(" ")
      )
      .join("</li><li>")} 
        </li></ul></aside><main class='col-md-3'></main><script>` +
      /* javascript */ `
      const main =document.querySelector("main");
      for(const a of document.querySelectorAll("a.nav")){
        a.addEventListener("click", function(e){
          e.preventDefault();
          fetch(e.target.href).then(res=>{
            res.text().then(html=>{
              main.innerHTML=html;
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
    }
    </script>  `
  );
}).listen(3000);
//
