import { SF2File } from './sffile';
import { generators, Preset } from './sf.types';
import { envAmplitue } from './envAmplitue';
import { loadMidiaa } from './load-midi';
import * as fs from 'fs';
import { LUT } from './LUT';
import { createServer } from 'http';
import { basename, resolve } from 'path';
export function httpd(port) {
  const sf = new SF2File(process.argv[3] || 'file.sf2', 48000);
  const { presets } = sf.sections.pdta;
  const tones = Object.values(presets[0]);
  const drums = Object.values(presets[128]);
  const server = createServer((req, res) => {
    let m;
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
      return;
    } else if ((m = req.url.match(/sample\/(\d+)\/(\d+)\/(\d+)\/(\d+)/))) {
      const [, bankId, presetId, key, vel] = m;

      sf.keyOn({ bankId: bankId, presetId, key, vel }, 0.5, 0);

      res.writeHead(200, { 'Content-Type': 'audio/raw' });
      res.end(sf.render(48000));
      return;
      //res.end();
    } else if ((m = req.url.match(/preset\/(\d+)\/(\d+)/))) {
      res.write('<table border=1>');
      res.write(
        `<tr><td>${`attack,decay,sustain,release,krange,vrange,attentuation,pan,pitch,samplerate,tuning`
          .split(',')
          .join('</td><td>')}</td></tr>`
      );
      const { fineTune, coarseTune, overridingRootKey } = generators;
      const bank = sf.sections.pdta.presets[m[2]];
      [bank[m[1]].defaultBag]
        .concat(bank[m[1]].zones)
        .filter((z) => z && z.keyRange && z.velRange)
        .map((z) => {
          const playFn = `playSample()`;
          res.write(
            `<tr><td>${[
              ...z.misc.envelopPhases,
              Object.values(z.keyRange).join('-'),
              Object.values(z.velRange).join('-'),
              LUT.cent2amp[z.attenuation],
              z.pan,
              z.generators[overridingRootKey]?.amount ||
                z.sample?.originalPitch,
              z.sample?.sampleRate,
              z.sample?.name,
              `<a class="pcm" href="/sample/${m[2]}/${m[1]}/${
                z.keyRange.hi - 5
              }/${z.velRange.lo + 5}">play</a>`,
            ].join('</td><td>')}</td> </tr>`
          );
        });
      res.end('</table>');
      return;
    } else if (req.url.startsWith('/js')) {
      res.writeHead(200, { 'Content-Type': 'application/javascript' });
      fs.createReadStream(resolve('js', basename(req.url))).pipe(res);
    } else if (req.url.match('/bootstrap.min.css')) {
      res.writeHead(200, { 'Content-Type': 'text/css' });

      fs.createReadStream('./bootstrap.min.css').pipe(res);
      return;
    } else {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`<!DOCTYPE html5>
      <html>
        <head>
        <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css" integrity="sha384-JcKb8q3iqJ61gNV9KGb8thSsNjpSL0n8PARn9HuZOnIxN0hoP+VmmDGMN5t9UJ0Z" crossorigin="anonymous">        </head>
        <body class="container row">
          <aside class="col-md-3">
            <ul class="list-group" style="max-height: 15; overflow-y: scroll">
              ${fs.readdirSync('midi/').map((file) => midilink(file))}
            </ul>
            <ul class="list-group" style="max-height: 15vh; overflow-y: scroll">
              ${tones.map((p) => presetlink(p))} ${drums.map((p) =>
        presetlink(p)
      )}
            </ul>
          </aside>
          <main id="root" class="col-md-6">
            <ul class="list-group" style="max-height: 69vh; overflow-y: scroll">
              ${fs.readdirSync('midi/').map((file) => midilink(file))}
            </ul>
          </main>
          <div class="col-mid-3" id="report">
            <a class="pcm" href="https://grep32bit.blob.core.windows.net/pcm/12v16.pcm">12v16</a>
            <p></p>
            <p></p>
            <p></p>
            <p></p>
            <iframe name="23"></iframe>
          </div>
          <script src="/js/playpcm.js">
          </script>
          <script>
          document.querySelectorAll("a.nav").forEach((a) => {
  a.addEventListener("click", (e) => {
    e.preventDefault();
    fetch(e.target.href).then(res=>res.text()).then(html=>{
      document.querySelector('main').innerHTML=html;
      for (const i of  document.querySelector('main').querySelectorAll('a.pcm')) {
        i.addEventListener('click', (e) => {
          e.preventDefault();
          start(e.target.href);
          return true;
        });
      }
    });
 
  });
});
          </script>
        </body>
      </html>`);
    }
  });
  server.listen(port);

  process.on('uncaughtException', (e) => {
    console.error('NOTICE:', e);
  });
  server.on('error', console.error);
  return server;
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
        <a class='nav' target='_main' href="/preset/${p.presetId}/${p.bankId}">go</a>
        </div>
        </li>`;
}
httpd(3000).on('listening', console.log);
