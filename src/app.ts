import { createServer, IncomingMessage, ServerResponse } from 'http';
import { Runtime } from './runtime';
import { loop } from './Utils';
import { generatorNames, keys88, sf_gen_id } from './sf.types';
import * as fs from 'fs';
import { uint8sf2 } from './SFBK';
import { sleep } from './utilv1';
import { URLSearchParams } from 'url';

import { readFileSync, existsSync, createReadStream } from 'fs';
import path from 'path';
import { PDTA } from './pdta';
import { SFZone } from './Zone';
const resolve = require('path').resolve;
const ab = new Uint8Array(readFileSync('./file.sf2'));
uint8sf2(ab)
  .then((sfbk) =>
    createServer((req, res) => handl(req, res, sfbk)).listen(3995)
  )
  .catch((e) => console.debug(e));
function handl(
  req: IncomingMessage,
  res: ServerResponse,
  {
    pdta,
    sdta,
    runtime,
  }: {
    sdta: { bit16s: Uint8Array; data: Uint8Array };
    sdtastart: number;
    sdtaByteLength: number;
    pdta: PDTA;
    runtime: (
      presetId: any,
      key: any,
      vel?: number,
      bankId?: number
    ) => false | Runtime[];
  }
) {
  const paras = new URLSearchParams(req.url!.split('?')[1]);
  let [_, cmd, a1, a2, a3, a4] = req.url!.split('/');

  if (paras.has('pid')) {
    cmd = 'pid';
    a1 = paras.get('pid');
  }

  switch (cmd) {
    case '':
      return createReadStream('./index.html').pipe(res, { end: true });
      break;
    case 'presets':
      const p = pdta.findPreset(
        parseInt(a1),
        parseInt(a2),
        parseInt(a3),
        parseInt(a4)
      );
      return retj(res, p || []);

    case 'pgen':
      replyhtml(res);

      res.write(
        pdta.pbag
          .map((p: { pzone: any }) => p.pzone)
          .map((z: { generators: any }) => JSON.stringify(z.generators))
          .join('<br>')
      );
      res.end();
      break;
    case 'igen':
      replyhtml(res);

      let ibagIdx = 0,
        instId = 0;

      pdta.igen.map(
        (
          p: {
            operator: number;
            range: { lo: string; hi: string };
            s16: string | number;
          },
          i: number
        ) => {
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
        }
      );

      res.end();
      break;
    case 'grid':
      break;
    case 'runzone':
      const rt = runtime(
        parseInt(a1),
        parseInt(a2),
        parseInt(a3),
        parseInt(a4)
      );
      if (!rt) return res.end(`HTTP/1.1 404`);

      retj(res, rt.zone);

      break;
    case 'sample':
      const shr = pdta.shdr[a1];
      replypcm(res, shr.end * 4 - shr.start * 4);
      res.end(sdta.bit16s.slice(shr.start * 2, shr.end * 2));
      break;
    case 'inst':
      if (a1) {
        retj(res, {
          header: pdta.iheaders[a1],
          ibags: pdta.iheaders[a1].ibags.map(
            (ib: string | number, idex: any) => ({
              id: ib,

              ...pdta.ibag[ib].izone,
            })
          ), // pdta.ibag[]
        });
      } else if (paras.has('name')) {
        const matches = pdta.iheaders.filter(
          (ih: { name: (string | null)[] }) =>
            ih.name.includes(paras.get('name'))
        );
        if (!matches.length) return res.writeHead(404);
        retj(res, {
          header: matches,
        });
      } else {
        retj(
          res,
          pdta.iheaders.map(({ name, ibagIndex }: any, idex: any) => ({
            name,
            index: idex,
            ib: pdta.ibag[ibagIndex],
            defaultBag: pdta.ibag[ibagIndex],
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
          pdta.phdr.filter((p: { insts: number[] }) => {
            p.insts.indexOf(parseInt(paras.get('instId'))) > -1;
          })
        );
      } else {
        retj(
          res,
          pdta.phdr.map(({ name, defaultBag }: any, idex: any) => ({
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
      presets.map((z: SFZone) => {
        const rt = new Runtime(z, { key: 55, velocity: 44 }, 48000);
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
      return fs.createReadStream(resolve('js', a1, a2)).pipe(res);
    case 'sdta.wasm':
      res.writeHead(200, { 'content-type': 'application/wasm' });

      return fs.createReadStream('./sdta.wasm').pipe(res, { end: true });
    default:
      replystatic(req, res, 'public') || replystatic(req, res, __dirname);

      res.end();
  }
}
function replystatic(
  req: { url: any },
  res: { writeHead: (arg0: number) => any },
  basepath: string
) {
  if (!existsSync(resolve(basepath))) return res.writeHead(500);

  if (!existsSync(resolve(basepath, req.url))) return res.writeHead(404);

  return createReadStream(resolve(basepath, req.url)).pipe(res, { end: true });
}
function replypcm(res: ServerResponse, length: number) {
  res.writeHead(200, {
    'content-disposition': 'inline',
    'content-type': 'application/stream-octet',
    'content-length': `${length} bytes`,
  });
}

function replyhtml(res: ServerResponse) {
  res.writeHead(200, { 'content-type': 'text/html' });
}

function retj(res: ServerResponse, obj: { header: any; ibags?: any }) {
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
