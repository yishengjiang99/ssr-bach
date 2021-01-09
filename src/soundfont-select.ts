import { readFileSync } from "fs";
import { ServerHttp2Stream } from "http2";
import { createSecureServer } from "http2";
import { notelist } from "./filelist";
import { hotreloadOrPreload, parseUrl, pushFile } from "./fsr";
import { httpsTLS } from "./tls";
import { cspawn, std_settings } from "./utils";
import { LSSource, LSGraph, ReadlineTransform } from "grep-transform";
import stream, { Transform } from "stream";
import { produce } from "./sound-sprites";

const savefont = `ffmpeg -i -af showwavepic=s=555x800 -frames:v 4`;
const server = createSecureServer(httpsTLS);
server.on("error", (err) => console.error(err));
let [idx, idx1, idx2, idx3, css] = hotreloadOrPreload();

const noteLink = (instrument, note) =>
  `<a target="_w1" href="${instrument}/${note}"> ${note} </a>`;

server.on("stream", (stream: ServerHttp2Stream, headers) => {
  if (headers.path == "/comms") {
    stream.on("data", (d) => {
      console.log("INCOMING MSG stream", d.toString());
    });
  }
  const mid = "midi/song2.mid";
  const rc = produce(mid, stream);

  let output = 0;
  stream.write(`<main id='menu'>
    <iframe frameborder="0 "width="400" height="200" src="https://www.grepawk.com:8443/acoustic_grand_piano/3"></iframe>`);
  LSSource("./midisf")
    .pipe(new ReadlineTransform())
    .pipe(new LSGraph("sf"))
    .pipe(
      new Transform({
        transform: (chunk, enc, cb) => {
          const r = JSON.parse(chunk);
          if (r.n1 === "sf") {
            cb(null, "title");
          } else {
            const sfname = r.n1;
            cb(
              null,
              /* html */ `
              <details>
                <summary>${r.n1.substring(2)} ${r.dag
                .slice(12, 24)
                .map((note) => noteLink(sfname, note))
                .join("&nbsp;")}
                  </summary>
              ${r.dag.map((note) => noteLink(sfname, note))}
              </details>`
            );
          }
        },
      })
    )
    .pipe(stream)
    .on("end", () => {
      stream.write("</main>");
    });
});

server.listen(8443);
