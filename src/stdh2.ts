// import { readFileSync } from "fs";
// import { ServerHttp2Stream } from "http2";
// import { createSecureServer } from "http2";
// import { notelist } from "./filelist";
// import { hotreloadOrPreload, parseUrl, pushFile } from "./fsr";
// import { httpsTLS } from "./tls";
// import { cspawn, midiMeta, std_settings } from "./utils";
// import { LSSource, LSGraph, ReadlineTransform } from "grep-transform";
// import stream, { Transform } from "stream";
// import { produce } from "./sound-sprites";
// const savefont = `ffmpeg -i -af showwavepic=s=555x800 -frames:v 4`;
// const server = createSecureServer(httpsTLS);
// server.on("error", (err) => console.error(err));
// let [idx, idx1, idx2, idx3, css] = hotreloadOrPreload();

// const noteLink = (instrument, note) =>
//   `<a target="_w1" href="${instrument}/${note}"> ${note} </a>`;

// server.on("stream", (stream: ServerHttp2Stream, headers) => {
//   if (headers.path == "/comms") {
//     stream.on("data", (d) => {
//       console.log("INCOMING MSG stream", d.toString());
//     });
//   }
//   const mid = "midi/song2.mid";
//   const rc = produce(mid, stream);

//   stream.respond(
//     {
//       "content-type": "text/html; charset=utf-8",
//       ":status": 200,
//     },
//     { waitForTrailers: true }
//   );
//   stream.on("wantTrailers", () => {
//     console.log("ss");
//   });
//   stream.write(idx1);
//   stream.write(css);
//   stream.write(idx2);
//   stream.write(midiMeta(mid));
// });
