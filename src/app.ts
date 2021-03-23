import { readMidi } from './readmidi';
import { readFileSync } from 'fs';
import { Writable, PassThrough } from 'stream';
import { SF2File } from './sffile';
import { ffp } from './sinks';
import { basename } from 'path';
import { createServer } from 'http';
import { execSync } from 'child_process';
import { loadMidiBuffer } from './load-midi';
const sff = new SF2File('./file.sf2');
const u8b = new Uint8Array(readFileSync('midi/song.mid'));
const js = readFileSync('./js/ffplay-bundle.js');

createServer((req, res) => {
  const pt = new PassThrough();

  if (req.url == '/') {
    res.writeHead(200, {
      'Content-Type': 'text/HTML',
    });
    res.end(
      `<html><body>starting<button>start</button>
      <script type='module'>
      import {FF32Play} from "./js/ffplay-bundle.js";
	 const ff= new FF32Play()
	 ff.queue(window.location.href+"song");
ff.addEventListener("progress",e=>{
	console.log(e);
})
      </script></body></html>`
    );
  } else if (req.url.substr(0, 3) == '/js') {
    res.writeHead(200, {
      'Content-Type': 'application/javascript',
    });
    res.end(js);
  } else if (req.url == '/song') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'audio/raw',
      'Cache-Control': 'no-cache',
      'Content-Disposition': 'in-line',
      'x-bit-depth': 32,
      'x-sample-rate': 48000,
      'x-nchannel': 2,
    });
    const pt = new PassThrough();
    loadMidiBuffer(u8b, sff, pt).start();
    process.nextTick(() => pt.pipe(res));
  }
})
  .on('listening', () => {
    const ChromeLauncher = require('chrome-launcher');
    const newFlags = ChromeLauncher.Launcher.defaultFlags().filter(
      (flag) => flag !== '--disable-extensions' && flag !== '--mute-audio'
    );

    ChromeLauncher.launch({
      startingUrl: 'http://localhost:5454',
      chromeFlags: [...newFlags, '--autoplay-policy=no-user-gesture-required'],
    }).then((chrome) => {
      console.log(`Chrome debugging port running on ${chrome.port}`);
    });
  })
  .listen(5454);
