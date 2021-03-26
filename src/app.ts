import { SF2File } from './sffile';
import { resolve } from 'path';
import { sleep } from './utilv1';
const grepupload_1 = require('grepupload');
const express = require('express');
const router = express(); // create express ap
var bodyParser = require('body-parser');
var FormData = require('form-data');
async function init() {
  const sffiles = await grepupload_1.listContainerFiles('sf2');
  const midis = await grepupload_1.listContainerFiles('midi');
  const file = new SF2File('file.sf2');
  const { phdr, iheaders, shdr } = file.pdta;
  const mfiles = midis.map((m) => m.name);
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
  router.get('/sample/:key/:vel', async (req, res) => {
    const boundary = 'abcd';
    res.write(`HTTP/1.1 200 OK \r\n`);
    [
      `Content-Type: multipart/form-data; boundary=${boundary} \r\n\r\n`,
      `--${boundary} \r\n`,
      `Content-Type: application/json \r\n\r\n`,
      `${file.rend_ctx.keyOn(req.params.key, req.params.val, 0)}\r\n\r\n`,
    ].map((l) => res.write(l));

    [
      `--${boundary} \r\n`,
      `Content-Disposition: inline \r\n`,
      `Content-Type: audio/raw \r\n\r\n`,
    ].map((l) => res.write(l));

    for (let i = 0; i < 48000; i += 1280) {
      res.write(file.rend_ctx.render(1280));
      await sleep(35);
    }
  });

  require('http')
    .createServer(router)
    .listen(3000, () => {
      console.log('server started on port 3000');
    });
}
init();
