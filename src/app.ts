import { SF2File } from './sffile';
import { createServer, ServerResponse } from 'http';
import { Runtime } from './runtime';
import { loop } from './Utils';
import { generatorNames, keys88, sf_gen_id } from './sf.types';
import * as fs from 'fs';
import { RenderCtx } from './render-ctx';
import { PDTA, SFfromUrl } from './pdta';
const f = new SF2File('file.sf2');
SFfromUrl(
  'https://grep32bit.blob.core.windows.net/sf2/SoundBlasterOld.sf2'
).then(({ pdta, sdta: { data }, runtime }) => {
  createServer((req, res) => {
    const ctx = new RenderCtx(f);
    ctx.output = res;
    const [ff0, ff11] = fs
      .readFileSync('./src/template.html')
      .toString()
      .split('<!--ff1-->');
    const [ff1, ff2] = ff11.split('<!--ff2-->');
    const [base, query] = req.url.split('?');
    const paras = new URLSearchParams(query); //.get('pset');
    console.log(paras);
    let [_, cmd, a1, a2, a3, a4] = req.url.split('/');

    if (paras.has('pid')) {
      cmd = 'pid';
      a1 = paras.get('pid');
    }

    switch (cmd) {
      case '':
        res.write(ff0);

        let pbagIdx = 0,
          phdrId = 0;
        pdta.pgen.map((p, i) => {
          let hdr = '';

          if (
            pbagIdx < pdta.pbag.length &&
            pdta.pbag[pbagIdx + 1].pgen_id <= i
          ) {
            pbagIdx++;

            if (
              phdrId < pdta.phdr.length - 1 &&
              pdta.phdr[phdrId + 1].pbagIndex <= pbagIdx
            ) {
              phdrId++;
              hdr += '<br>--' + pdta.phdr[phdrId].name + ' ' + phdrId + '<br>';
              for (let i = 40; i < 70; i++) {
                hdr += `&nbsp;<a class='pcm' href="runzone/${pdta.phdr[phdrId].presetId}/${pdta.phdr[phdrId].bankId}/${i}/55">${keys88[i]}</a>`;
                if (i % 12 == 0) {
                  hdr += '<br>';
                }
              }
              hdr += '<br>';
              hdr += `<button class='ff2' href='/igen/${
                pdta.pbag[pbagIdx].pzone.instrumentID
              }'>${
                pdta.iheaders[pdta.pbag[pbagIdx]?.pzone?.instrumentID]?.name
              }</button>`;
              res.write(hdr);
            }
          }
        });
        res.write(ff1);
        res.write(ff2);

        res.end();
        break;
      case 'pgen':
        replyhtml(res);

        res.write(
          pdta.pbag
            .map((p) => p.pzone)
            .map((z) => z.generators)
            .join('<br>')
        );
        res.end();
        break;
      case 'igen':
        replyhtml(res);

        let ibagIdx = 0,
          instId = 0;

        pdta.igen.map((p, i) => {
          let hdr = '';
          if (
            ibagIdx < pdta.ibag.length &&
            pdta.ibag[ibagIdx + 1].igen_id <= i
          ) {
            ibagIdx++;

            if (
              instId < pdta.iheaders.length - 1 &&
              pdta.iheaders[instId + 1].iBagIndex <= ibagIdx
            ) {
              instId++;
              hdr += '<br>--' + pdta.iheaders[instId].name + ' ' + instId;
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
                ? `<button class='pcm' href='sample/${p.s16}' target='ff3'>${
                    pdta.shdr[p.s16].name
                  }</button>`
                : p.s16
            } ${i}<br>`
          );
        });

        res.end();
        break;
      case 'grid':
        break;
      case 'runzone':
        const ob: Buffer = Buffer.alloc(1024);
        ctx._render(runtime(a1, 0, parseInt(a3), 66), ob, 12000, 4);

        res.writeHead(200, {
          'content-disposition': 'inline',
          'content-type': 'application/stream-octet',
          'content-length': `${48000 * 2 * 8} bytes`,
          metalog: `${JSON.stringify(ctx.voices[0].mods)}`,
        });
        res.write(ob);
        ctx._render(runtime(a1, 0, parseInt(a3), 66), ob, 12000, 4);
        res.write(ob);
        ctx._render(runtime(a1, 0, parseInt(a3), 66), ob, 12000, 4);

        res.write(ob);
        ctx._render(runtime(a1, 0, parseInt(a3), 66), ob, 12000, 4);

        res.write(ob);

        ctx.start();
        break;
      case 'sample':
        const shr = pdta.shdr[a1];
        replypcm(res, shr.end * 4 - shr.start * 4);
        res.end(new Uint8Array(data.slice(shr.start * 4, shr.end * 4)));
        break;
      case 'inst':
        if (a1) {
          retj(res, {
            header: pdta.iheaders[a1],
            ibags: pdta.iheaders[a1].ibags.map((ib, idex) => ({
              id: ib,

              ...pdta.ibag[ib].izone,
            })), // pdta.ibag[]
          });
        } else if (paras.has('name')) {
          const matches = pdta.iheaders.filter((ih) =>
            ih.name.includes(paras.get('name'))
          );
          if (!matches.length) return res.writeHead(404);
          retj(res, {
            header: matches,
          });
        } else {
          retj(
            res,
            pdta.iheaders.map(({ name, defaultIbag }, idex) => ({
              name,
              index: idex,
              ib: pdta.ibag[defaultIbag],
              defaultBag: defaultIbag && pdta.ibag[defaultIbag]?.izone,
            }))
          );
        }
        break;
      case 'pheader':
      case 'phdr':
        if (a1) {
          retj(res, pdta.phdr[a1]);
        } else if (paras.has('instId')) {
          return retj(
            res,
            pdta.phdr.filter((p) => {
              p.insts.indexOf(parseInt(paras.get('instId'))) > -1;
            })
          );
        } else {
          retj(
            res,
            pdta.phdr.map(({ name, defaultBag }, idex) => ({
              name,
              index: idex,
              ib: pdta.pbag[defaultBag],
              defaultBag: defaultBag && pdta.pbag[defaultBag]?.pzone,
            }))
          );
        }

        break;
      case 'pid':
        replyhtml(res);
        const presets = pdta.findPreset(
          a1,
          0,
          (a2 && parseInt(a2)) || -1,
          (a3 && parseInt(a3)) || -1
        );
        presets.map((z) => {
          const rt = new Runtime(z, { key: 55, velocity: 44 });
          res.write('<table border=1>');
          res.write(`<tr><td colspan=3></td><td rowspan=9>vol run:`);
          loop(32, () => res.write(`<li>${rt.run(125).pitch}</li>`));
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
});
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
