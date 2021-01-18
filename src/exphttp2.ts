// export const run = (port, tls = httpsTLS) => {
//   process.env.port = port;

//   page2preload = (() => {
//     let page2html = readFileSync("fullscreen.html").toString();
//     let precache = [
//       "fetchworker.js",
//       "proc2.js",
//       "panel.js",
//       "misc-ui.js",
//       "analyserView.js",
//     ].reduce((map, entry) => {
//       map["./js/build/" + entry] = readFileSync("./js/build/" + entry).toString();
//       return map;
//     }, {});
//     let [idx, idx1, beforeMain, idx2, idx3, css] = hotreloadOrPreload("fullscreen.html");
//     precache["style.css"] = readFileSync("./style.css").toString();
//     return {
//       page2html,
//       precache,
//       idx,
//       idx1,
//       beforeMain,
//       idx2,
//       idx3,
//       css,
//     };
//   })();
//   const server = createServer(tls, handler);
//   server.on("stream", handleStream);

//   process.on("uncaughtException", (e) => {
//     console.log("f ", e);
//   });

//   server.on("upgrade", wshand);
//   server.listen(port); //3000);
//   return {
//     activeSessions,
//     server,
//   };
// };
// export function handleStream(
//   stream: ServerHttp2Stream,
//   headers: IncomingHttpHeaders,
//   flags: number
// ) {
//   let m = headers[":path"].match(/\/midi\/(\S+)/);
//   if (!m) {
//     return;
//   }
//   const { page2html, precache, idx, idx1, beforeMain, idx2, idx3, css } = page2preload;
//   const file = resolve("midi/" + decodeURIComponent(m[1].replace(".html", "")));
//   if (!existsSync(file)) {
//     stream.respond({
//       ":status": 404,
//     });
//     return stream.end();
//   }
//   stream.respond(
//     {
//       ":status": 200,
//       "Content-Type": "text/html",
//     },
//     { waitForTrailers: true }
//   );
//   const [parts, query] = parseUrl(headers[":path"]);

//   currentSession(query["cookie"], parts, query);
//   const meta = midiMeta(file);
//   const h = (str: TemplateStringsArray, ...args) => {
//     for (const st of str.entries()) {
//       stream.write(st);
//       stream.write(args.shift());
//     }
//   };
//   stream.write(/* html */ `<!DOCTYPE html>
// 	  <html>
// 		<head>
// 		  <meta charset="utf-8" />
// 		  <title>${file}</title>
// 		  <style>${css}</style>
// 		</head>
// 		<body>g
// 		  <div class="fullscreen">
// 			<canvas></canvas>
// 		  </div>g
// 		  <div id="panel"></div>
// 		  <pre id="stdout"></pre>
// 		  <script type="module" src="/js/build/panel.js"></script>
// 		</body>
// 	  </html>
//   `);
//   // res.write(idx2);
// }
// const wavheader = Buffer.allocUnsafe(56);
// openSync("./cachedheader.WAV", "r");
// readSync(openSync("./cachedheader.WAV", "r"), wavheader, 0, 56, 0);
