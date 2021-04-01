import { SF2File } from './sffile';
import { createServer, ServerResponse } from 'http';
import { Runtime } from './runtime';
import { loop } from './Utils';
import { generatorNames, keys88, sf_gen_id } from './sf.types';
import * as fs from 'fs';
import { RenderCtx } from './render-ctx';
import { resjson, sleep } from './utilv1';

const f = new SF2File('./file.sf2');
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
      res.write("<form><select name='pid'>");
      f.pdta.phdr.map((p) =>
        res.write(`<option value=${p.presetId}>${p.name}</option>`)
      );
      res.write(
        `</select><input type='range' min=-1 max=129 value=-1 step=1 /></form>`
      );

      let pbagIdx = 0,
        phdrId = 0;
      res.write(`<script>const pdta={}</script>`);
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
              hdr += `&nbsp;<a class='pcm' href="runzone/${f.pdta.phdr[phdrId].presetId}/${f.pdta.phdr[phdrId].bankId}/${i}/55">${keys88[i]}</a>`;
              if (i % 12 == 0) {
                hdr += '<br>';
              }
            }
            hdr += '<br>';
            hdr += `<button class='ff2' href='/igen/${
              f.pdta.pbag[pbagIdx].pzone.instrumentID
            }'>${
              f.pdta.iheaders[f.pdta.pbag[pbagIdx]?.pzone?.instrumentID]?.name
            }</button>`;
            res.write(hdr);
          }
        }
      });
      res.write(ff1);
      res.write(ff2);

      res.end();
      break;
    case 'igen':
      replyhtml(res);

      let ibagIdx = 0,
        instId = 0;

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
              ? `<button class='pcm' href='sample/${p.s16}' target='ff3'>${
                  f.pdta.shdr[p.s16].name
                }</button>`
              : p.s16
          } ${i}<br>`
        );
      });

      res.end();
      break;
    case 'runzone':
      ctx.programs[0] = {
        presetId: parseInt(a1),
        bankId: parseInt(a2),
      };

      const z = ctx.keyOn(parseInt(a3), parseInt(a4), 0, 0);
      res.writeHead(200, {
        'content-disposition': 'inline',
        'content-type': 'application/stream-octet',
        'content-length': `${48000 * 2 * 8} bytes`,
        metalog: `${JSON.stringify(ctx.voices[0].mods)}`,
      });
      ctx.output = res;
      ctx.start();
      break;
    case 'sample':
      const shr = f.pdta.shdr[parseInt(a1)];
      replypcm(res, shr.end * 4 - shr.start * 4);
      res.end(f.sdta.data.slice(shr.start * 4, shr.end * 4));
      break;
    case 'inst':
      if (a1) {
        retj(res, {
          header: f.pdta.iheaders[a1],
          ibags: f.pdta.iheaders[a1].ibags.map((ib, idex) => ({
            id: ib,

            ...f.pdta.ibag[ib].izone,
          })), // f.pdta.ibag[]
        });
      } else if (paras.has('name')) {
        const matches = f.pdta.iheaders.filter((ih) =>
          ih.name.includes(paras.get('name'))
        );
        if (!matches.length) return res.writeHead(404);
        retj(res, {
          header: matches,
        });
      } else {
        retj(
          res,
          f.pdta.iheaders.map(({ name, defaultIbag }, idex) => ({
            name,
            index: idex,
            ib: f.pdta.ibag[defaultIbag],
            defaultBag: defaultIbag && f.pdta.ibag[defaultIbag]?.izone,
          }))
        );
      }
      break;
    case 'pheader':
    case 'phdr':
      if (parseInt(a1) !== NaN) {
        retj(res, f.pdta.phdr[a1]);
      } else if (paras.has('instId')) {
        return retj(
          res,
          f.pdta.phdr.filter((p) => {
            p.insts.indexOf(parseInt(paras.get('instId'))) > -1;
          })
        );
      } else {
        retj(
          res,
          f.pdta.phdr.map(({ name, defaultBag }, idex) => ({
            name,
            index: idex,
            ib: f.pdta.pbag[defaultBag],
            defaultBag: defaultBag && f.pdta.pbag[defaultBag]?.pzone,
          }))
        );
      }

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
