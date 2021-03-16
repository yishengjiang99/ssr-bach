import { SF2File } from './sffile';
import { Preset } from './sf.types';
import { loadMidiaa } from './load-midi';
import * as fs from 'fs';
import { createServer } from 'http';
import { basename, resolve } from 'path';
import { Writable } from 'stream';

export function httpd(port: number) {
  const sf = new SF2File(process.argv[3] || 'file.sf2');
  const { presets } = sf.sections.pdta;
  const tones = Object.values(presets[0]);
  const drums = Object.values(presets[128]);
  let {
    main,
    left,
    footer,
  }: { main: string; left: string; footer: string } = gg(tones, drums);
  const server = createServer((req, res) => {
    let m: any[];
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
      const [, bankId, presetId, key, vel] = m;

      sf.keyOn({ bankId: bankId, presetId, key, vel }, 2.5, 0);

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
        'delay',
        'attack',
        'hold',
        'decay',
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
      function range(a, b) {
        const arr = [];
        for (let i = a; i < b; i++) {
          arr.push(a);
        }
        return arr;
      }
      const zoneRows = zones.map((z) => [
        range(z.keyRange.lo, z.keyRange.hi)
          .map((k) => sampleLink(bankId, presetId, z.velRange.hi, k))
          .join(' '),
        z.keyRange.lo + '-' + z.keyRange.hi,
        z.velRange.lo + '-' + z.velRange.hi,
        z.pitchAdjust(z.velRange.lo),
        z.pan,
        z.sample?.originalPitch,
        z.sample?.sampleRate,
        z.sample?.name,
      ]);

      main = `${[bankId, presetId, name].join('|')}
      <table>
        <thead><tr>${colums
          .map((col) => `<td>${col}</td>`)
          .join('')}</tr></thead>
      <tr></tr>
      ${zoneRows
        .map((row) => `<tr>${row.map((c) => `<td>${c}</td>`).join('')}</tr>`)
        .join('')}
      </table>`;

      renderHtml(res, { main, left, footer });
      res.end();
    } else {
      main =
        fs
          .readdirSync('midi')
          .map((f) => midilink(f))
          .join('') + fs.readFileSync('./pcmblobs.xml').toString();

      res.writeHead(200, { 'Content-Type': 'text/html' });
      renderHtml(res, { main, left, footer });
      res.end();
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

function gg(tones: Preset[], drums: Preset[]) {
  let main: string = '',
    left: string = `  
  <ul class="list-group" style="max-height: 25vh; overflow-y: scroll">
  ${tones.map((d) => presetlink(d))}
  </ul>
  <ul class="list-group" style="max-height: 25vh; overflow-y: scroll">
  ${drums.map((d) => presetlink(d))}
  </ul>`,
    footer: string = '<div id="playerdiv">';
  return { main, left, footer };
}

function renderHtml(res: Writable, { main, left, footer }) {
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
        <script>

        </script>
      </body>
    </html>`);
}

function midilink(file: string): string {
  return `<li class='list-group-item'>
  <a class='pcm' href='#/pcm/${encodeURIComponent(file)}'>${file}</a>
  </li>`;
}
function sampleLink(presetId, bankId, vel, key): string {
  return `
  <a class='pcm' href="#${['sample', bankId, presetId, key, vel].join(
    '/'
  )}">${key}</a>
    `;
}
function presetlink(p: Preset): string {
  return `<li class='list-group-item'><div>${p.name} (${p.zones.length})
        <a href="/preset/${p.presetId}/${p.bankId}"'>go</a>
        </div>
        </li>`;
}

// /*
