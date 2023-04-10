import { SF2File } from './sffile';

import { RenderCtx } from './render-ctx';
import { createReadStream } from 'fs';
const grepupload_1 = require('grepupload');
const express = require('express');
const router = express(); // create express ap

export async function init() {
  const sffiles = await grepupload_1.listContainerFiles('sf2');
  const midis = await grepupload_1.listContainerFiles('midi');
  const file = new SF2File('file.sf2');
  const rend = new RenderCtx(file);
  const { phdr, iheaders, shdr } = file.pdta;
  const mfiles = midis.map((m) => m.name);

  router.get('/presets/:pid', (req, res) => {
    const psets = file.pdta.findPreset(
      phdr[req.params.pid].presetId,
      phdr[req.params.pid].bankId
    );
    res.json(psets);
  });
  router.use('/ffplay', (req, res) => {
    createReadStream('./js/build/' + req.params.file).pipe(res);
  });
  router.get('/sample/:channel/:key/:vel', async (req, res) => {
    res.write(`HTTP/1.1 200 OK \r\n`);
    const { key, vel, channel } = req.params;
    rend.keyOn(key, vel, channel);
    res.write(
      `Content-Disposition: form-data; name="audio" \r\n` +
        `Content-Type: application/octet-stream \r\n\r\n`
    );
    for (let i = 0; i < 48000; i += 1280) {
      res.write(rend.render(1280));
    }
    res.end(`\r\n\r\n`);
  });
  router.use('/', express.static('public'));
  router.get('/sf2/:name', (req, res) => {});
  router.get('/sf2', (req, res) => {
    res.json(sffiles);
  });
  router.get('/lists', async (req, res) => {
    res.json({ sffiles, midis, pdta: { phdr, iheaders, shdr } });
  });
  router.get('/sdta', (req, res) => {
    res.setHeader('content-type', 'application/octet-stream');
    res.end(file.sdta.bit16s);
  });
  require('http')
    .createServer(router)
    .listen(3000, () => {
      console.log('server started on port 3000');
    });
}
init();
