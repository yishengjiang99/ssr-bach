import { spawn } from "child_process";
import { readFileSync, createReadStream, existsSync, openSync } from "fs";
import { request, get } from "https";
const domain = "dsp.grepawk.com";
require("http2")
  .createSecureServer({
    key: readFileSync(`/etc/letsencrypt/live/${domain}/privkey.pem`),
    cert: readFileSync(`/etc/letsencrypt/live/${domain}/fullchain.pem`),
  })
  .on("stream", (stream, headers) => {
    stream.respond({
      ":status": 200,
      "content-type": "text/html",
    });
    stream.on("error", (error) => console.error(error));

    stream.pushStream(
      { ":path": "./lib/ffplay-bundle.js" },
      (err, pushStream) => {
        pushStream.respondWithFD(openSync("./js/build/playbundle.js", "r"));
      }
    );
    stream.end(html);
  })

  .listen(8443);
const html = `<html>
  <head>
  <body>
  <button>click</button>
  <script type='module'>
  import {FF32Play} from './lib/ffplay-bundle.js';
  document.querySelect("button").onclick=()=>{
    const ffp=new FF32Play();
    ffp.on('load',()=>{
      ffp.queue("/pcm");
    })
  }
  </script>
  </body>
  </html>`;
