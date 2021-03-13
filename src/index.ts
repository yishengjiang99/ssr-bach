import { SF2File } from './sffile';
import { generators, Preset, Zone } from './sf.types';
import { envAmplitue } from './envAmplitue';
import { loadMidiaa } from './load-midi';
import * as fs from 'fs';
import { LUT } from './LUT';
import { createServer } from 'http';
import { basename, resolve } from 'path';
import { Writable } from 'stream';

export function httpd(port: number) {
  const sf = new SF2File(process.argv[3] || 'file.sf2', 48000);
  const { presets } = sf.sections.pdta;
  const tones = Object.values(presets[0]);
  const drums = Object.values(presets[128]);
  let main: string = '',
    left: string = `  
  <ul class="list-group" style="max-height: 25vh; overflow-y: scroll">
  ${tones.map((d) => presetlink(d))}
  </ul>
  <ul class="list-group" style="max-height: 25vh; overflow-y: scroll">
  ${drums.map((d) => presetlink(d))}
  </ul>`,
    footer: string = '<div id="playerdiv">';
  const server = createServer((req, res) => {
    let m: any[];
    res.writeHead;
    if ((m = req.url.match(/pcm\/(.*)/))) {
      if (!fs.existsSync(resolve('midi', decodeURIComponent(m[1]))))
        return res.end('HTTP/1.1 404');
      res.write(
        'HTTP/1.1 200\r\nContent-Type:audio/raw \r\nContent-Disposition: inline \r\n\r\n'
      );
      loadMidiaa(
        resolve('midi', decodeURIComponent(m[1])),
        sf,
        res,
        48000
      ).loop();
    } else if ((m = req.url.match(/sample\/(\d+)\/(\d+)\/(\d+)\/(\d+)/))) {
      const [a, bankId, presetId, key, vel] = m;

      sf.keyOn({ bankId: bankId, presetId, key, vel }, 0.5, 0);

      res.writeHead(200, { 'Content-Type': 'audio/raw' });
      res.end(sf.render(48000));
      return;
      //res.end();
    } else if (req.url.startsWith('/js')) {
      res.writeHead(200, { 'Content-Type': 'application/javascript' });
      return fs
        .createReadStream(resolve('js', 'build', basename(req.url)))
        .pipe(res);
    } else if (req.url.match('/bootstrap.min.css')) {
      res.writeHead(200, { 'Content-Type': 'text/css' });

      fs.createReadStream('./bootstrap.min.css').pipe(res);
      return;
    } else if ((m = req.url.match(/preset\/(\d+)\/(\d+)/))) {
      const presetHeaders = sf.sections.pdta.presets[m[2]][m[1]];
      const colums = [
        'attack',
        'decay',
        'sustain',
        'release',
        'krange',
        'vrange',
        'attentuation',
        'pan',
        'pitch',
        'samplerate',
        'tuning',
      ];
      const { bankId, zones, presetId, name } = presetHeaders;
      res.writeHead(200, { 'content-type': 'text/html' });
      const zoneRows = zones
        .filter((z) => z.sample != null)
        .map((z) => [
          ...z.misc.envelopPhases,
          z.keyRange.lo + '-' + z.keyRange.hi,
          z.velRange.lo + '-' + z.velRange.hi,
          z.attenuation,
          z.pitchAjust(z.velRange.lo, 48000),
          z.pan,
          z.sample?.originalPitch,
          z.sample?.sampleRate,
          z.sample?.name,
        ]);
      console.log(colums);
      main = `<table>
        <thead><tr>${colums
          .map((col) => `<td>${col}</td>`)
          .join('')}</tr></thead>
      <tr>${[bankId, zones, presetId, name].map((c) => `<td>${c}</td>`)}<tr>
      ${zoneRows
        .map((row) => `<tr>${row.map((c) => `<td></td>`).join('')}</tr>`)
        .join('')}
      </table>`;
    } else {
      main =
        fs
          .readdirSync('midi')
          .map((f) => midilink(f))
          .join('') + fs.readFileSync('./pcmblobs.xml').toString();

      res.writeHead(200, { 'Content-Type': 'text/html' });
      renderHtml(res, 'index', { main, left, footer });
    }
  });
  server.listen(port);

  process.on('uncaughtException', (e) => {
    console.error('NOTICE:', e);
  });
  server.on('error', console.error);
  return server;
}

httpd(3000).on('listening', (e: any) => console.log(e));

function renderHtml(res: Writable, page, { main, left, footer }) {
  return res.write(/* html */ `
      
<!DOCTYPE html5>
    <html>
      <head>
      <link rel="stylesheet" 
      href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css" integrity="sha384-JcKb8q3iqJ61gNV9KGb8thSsNjpSL0n8PARn9HuZOnIxN0hoP+VmmDGMN5t9UJ0Z" crossorigin="anonymous">        </head>
      <body>
        <div class='container row'>
        <div class="sidenav">
          ${left}
        </div>
        <main id="root" class="col-md-6">
          ${main || ''};
          <ul class="list-group" style="max-height: 69vh; overflow-y: scroll">
          
          </ul>
        </main>
        </div>
        <div class="footer">
          ${footer}
        </div>
        <canvas style='opacity:0;position:absolute;width:100vw;height:100vh;background-color:black;z-index:-1'></canvas>
        <script src="/js/build/playpcm.js">
        </script>
        <script>document.onload=function(){
          document.querySelectorAll("a.pcm").forEach(a=>{
            a.onclick=(e)=>{
              e.preventDefault();
              start(e.target.href)
            }
          })
        }</script>
      </body>
    </html>`);
}

function midilink(file: string): string {
  return `<li class='list-group-item'>
  <a class='pcm' onclick='start("/pcm/${encodeURIComponent(
    file
  )}")'  href='#'>${file}</a>
  </li>`;
}

function presetlink(p: Preset): string {
  return `<li class='list-group-item'><div>${p.name} (${p.zones.length})
        <a href="/preset/${p.presetId}/${p.bankId}">go</a>
        </div>
        </li>`;
}
function renderPage(ctx: {
  res: Writable;
  layout?: String;
  delimiter?: string;
}) {
  const { layout, res, delimiter } = Object.assign(ctx, {
    layout: 'js/index.html',
    delimiter: '<main>',
  });
  const layoutStr = fs.readFileSync(layout).toString().split(delimiter);
  res.write(layout[0]);
  return function page(html: TemplateStringsArray, args: { shift: string }) {
    html.forEach((p) => res.write(p + args.shift));
    res.write(layout[1]);
  };
}
// /*
