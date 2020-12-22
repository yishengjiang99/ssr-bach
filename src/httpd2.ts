import { readFileSync, createReadStream, existsSync, openSync } from "fs";
const domain = "dsp.grepawk.com";
require("http2")
  .createSecureServer({
    key: readFileSync(`/etc/letsencrypt/live/${domain}/privkey.pem`),
    cert: readFileSync(`/etc/letsencrypt/live/${domain}/fullchain.pem`),
  })
  .on("stream", (stream, headers) => {
    stream.respond({
      contentType: "text/html",
      status: 200,
    });

    stream.pushStream(
      { ":path": "./lib/ffplay-bundle.js" },
      (err, pushStream) => {
        pushStream.respond({
          ":status": 200,
          "content-type": "application/javascript",
        });
        createReadStream("./ffplay-bundle.js").pipe(pushStream);
      }
    );
    stream.end(`
	<html>
		<head>
		<body>
		<button>click</button>
		<script type='module'>
		import {FF32Play} from './lib/ffplay-bundle.js';
		document.querySelect("button").onclick=()=>{
			const ffp=new FF32Play();
			// ffp.on('load',()=>{
			// 	ffp.queue("/pcm");
			// })
		}
		</script>
		</body>
		</html>
		`);
  })
  .listen(443);
