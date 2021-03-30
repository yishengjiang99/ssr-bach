import { SF2File } from './sffile';
import { createServer, ServerResponse } from 'http';
import { Runtime } from './runtime';
import { loop } from './Utils';
import { generatorNames, keys88, sf_gen_id } from './sf.types';
import * as fs from 'fs';
import { Shdr } from './pdta.types';
const f = new SF2File('file.sf2');
createServer((req, res) => {
  const [_, cmd, a1, a2, a3] = req.url.split('/');
  switch (cmd) {
    case '':
    case 'pgen':
      res.writeHead(200, { 'content-type': 'text/html' });
      res.write('<!doctype html><html><body>');
      res.write(
        "<iframe src='/igen' style='position:fixed; right:10px;top:10px;width:50vw;height:100vh' name='ff2'>      </iframe><main><div style=\"position:fixed;top:10px,width:300px;height:200px\"><canvas></canvas></div>	"
      );

      let pbagIdx = 0,
        phdrId = 0;
      f.pdta.pgen.map((p, i) => {
        let hdr = '';

        if (
          pbagIdx < f.pdta.pbag.length &&
          f.pdta.pbag[pbagIdx + 1].pgen_id <= i
        ) {
          pbagIdx++;

          if (
            phdrId < f.pdta.phdr.length - 1 &&
            f.pdta.phdr[phdrId + 1].pbagIndex <= pbagIdx
          ) {
            phdrId++;
            hdr += '<br>--' + f.pdta.phdr[phdrId].name + ' ' + phdrId + '<br>';
            for (let i = 40; i < 70; i++) {
              hdr += `&nbsp;<a class='pcm' target='ff3' href="#runzone/${f.pdta.phdr[phdrId].presetId}/${i}/55">${keys88[i]}</a>`;
              if (i % 12 == 0) {
                hdr += '<br>';
              }
            }
            hdr += '<br>';
          }
        }
        res.write(
          hdr + phdrId + ' pbag' + pbagIdx + '-' + generatorNames[p.operator]
        );
        res.write(
          `: ${
            p.operator == 44 || p.operator == 43
              ? p.range.lo + '-' + p.range.hi
              : p.operator == sf_gen_id.instrument
              ? `<a href='/igen/${p.s16}' target='ff2'>${
                  f.pdta.iheaders[p.s16].name
                }</a>`
              : p.s16
          } ${i}<br>`
        );
      });
      res.write('</main><script src="js/build/playpcm.js"></script>');

      res.write('</body></html>');

      res.end();
      break;
    case 'igen':
      replyhtml(res);

      let ibagIdx = 0,
        instId = 0;
      res.write(
        '<main><div style="position:fixed;top:10px,width:300px;height:200px;"><canvas></canvas></div>'
      );

      f.pdta.igen.map((p, i) => {
        let hdr = '';
        if (
          ibagIdx < f.pdta.ibag.length &&
          f.pdta.ibag[ibagIdx + 1].igen_id <= i
        ) {
          ibagIdx++;

          if (
            instId < f.pdta.iheaders.length - 1 &&
            f.pdta.iheaders[instId + 1].iBagIndex <= ibagIdx
          ) {
            instId++;
            hdr += '<br>--' + f.pdta.iheaders[instId].name + ' ' + instId;
          }
          hdr += '<br>';
        }
        if (a1 && parseInt(a1) != instId) return;

        res.write(hdr + ibagIdx + '-' + generatorNames[p.operator]);
        res.write(
          `: ${
            p.operator == 44 || p.operator == 43
              ? p.range.lo + '-' + p.range.hi
              : p.operator == sf_gen_id.sampleID
              ? `<a class='pcm' href='#sample/${p.s16}' target='ff3'>${
                  f.pdta.shdr[p.s16].name
                }</a>`
              : p.s16
          } ${i}<br>`
        );
      });
      res.write('</main><iframe name="ff3"></iframe>');
      res.write('<script src="/js/build/playpcm.js"></script>');
      res.write('</body></html>');

      res.end();
      break;
    case 'runzone':
      const zz = (f.rend_ctx.programs[0] = {
        presetId: parseInt(a1),
        bankId: 0,
      });
      f.rend_ctx.keyOn(parseInt(a2), a3, 1, 0, 0);
      replypcm(res, 48000 * 2 * 4);

      loop(350, () => res.write(f.rend_ctx.render(128)));
      res.end();
      break;
    case 'sample':
      const shr = f.pdta.shdr[parseInt(a1)];

      replypcm(res, shr.end * 4 - shr.start * 4);
      res.end(f.sdta.data.slice(shr.start * 4, shr.end * 4));
      break;
    case 'inst':
      retj(res, f.pdta.iheaders);
      break;
    case 'pid':
      replyhtml(res);

      const presets = f.pdta.findPreset(
        a1,
        0,
        (a2 && parseInt(a2)) || -1,
        (a3 && parseInt(a3)) || -1
      );
      presets.map((z) => {
        const rt = new Runtime(
          z,
          { key: 55, velocity: 44, channel: 0 },
          f.rend_ctx
        );
        res.write('<table border=1>');
        res.write(`<tr><td colspan=3></td><td rowspan=9>vol run:`);
        loop(10, () => res.write(`<li>${rt.run(1283).volume}`));
        res.write('</td></tr>');

        for (const k in z) {
          if (typeof z[k] == 'object') {
            for (const kk in z[k]) {
              if (typeof z[k][kk] == 'object') {
                for (const kkl in z[k][kk]) {
                  res.write(
                    `<tr><td>${k}</td><td>${kk}-${kkl}</td><td>${z[k][kk][kkl]}</td></tr>`
                  );
                }
              } else {
                res.write(
                  `<tr><td>${k}</td><td>${kk}</td><td>${z[k][kk]}</td></tr>`
                );
              }
            }
          } else {
            res.write(`<tr><td colspan=2>${k}</td><td>${z[k]}</td></tr>`);
          }
        }
        res.write('</table>');
      });

      res.end('</body></html>');

      break;
    case 'js':
      res.writeHead(200, { 'content-type': 'application/javascript' });
      return fs
        .createReadStream(require('path').resolve('js', a1, a2))
        .pipe(res);
      break;
    default:
      res.end('');
      break;
  }
}).listen(3000);
function replypcm(res: ServerResponse, length: number) {
  res.writeHead(200, {
    'content-disposition': 'inline',
    'content-type': 'application/stream-octet',
    'content-length': `${length} bytes`,
  });
}

function replyhtml(res: ServerResponse) {
  res.writeHead(200, { 'content-type': 'text/html' });
  res.write('<!doctype html><html><body>');
}

function retj(res: ServerResponse, obj) {
  res.end(
    JSON.stringify(
      obj,
      (k: string, v: any) => {
        return k == 'generators' ? '' : v;
      },
      2
    )
  );
}
