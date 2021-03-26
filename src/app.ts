import { SF2File } from './sffile';
import { resolve } from 'path';
import { sleep } from './utilv1';
import { PassThrough } from 'stream';
import { RenderCtx } from './render-ctx';
const grepupload_1 = require('grepupload');
const express = require('express');
const router = express(); // create express ap

async function init() {
  const sffiles = await grepupload_1.listContainerFiles('sf2');
  const midis = await grepupload_1.listContainerFiles('midi');
  const file = new SF2File('file.sf2');
  const rend = new RenderCtx(file);
  console.log(file.rend_ctx.voices);
  const { phdr, iheaders, shdr } = file.pdta;
  const mfiles = midis.map((m) => m.name);
  router.get('/sample/:key/:vel', async (req, res) => {
    res.write(`HTTP/1.1 200 OK \r\n`);
    const rendder = rend.render;
    res.write(
      `Content-Disposition: form-data; name="audio" \r\n` +
        `Content-Type: application/octet-stream \r\n\r\n`
    );
    for (let i = 0; i < 48000; i += 1280) {
      res.write(rendder(1280));
    }

    res.end(`\r\n\r\n`);
  });
  router.use('/', express.static('public'));
  router.get('/lists', (req, res) => {
    res.json({ mfiles, pdta: { phdr, iheaders, shdr } });
  });

  router.get('/presets/:pid', (req, res) => {
    const psets = file.pdta.findPreset(
      phdr[req.params.pid].presetId,
      phdr[req.params.pid].bankId
    );
    res.json(psets);
  });

  require('http')
    .createServer(router)
    .listen(3000, () => {
      console.log('server started on port 3000');
    });
}
init();
