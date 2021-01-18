import {
  Http2Stream,
  createSecureServer,
  ServerHttp2Stream,
  IncomingHttpHeaders,
} from "http2";
import { midifiles } from "./filelist";
import { parseUrl, pushFile } from "./fsr";
import { Player } from "./player";
export function handleStream(
  stream: ServerHttp2Stream,
  headers: IncomingHttpHeaders,
  flags: number
) {
  const midifile = headers[":path"] || "/song.mid";
  const file = "./midi/" + midifile;
  new Player().playTrack(file, stream);
  stream.respond({
    ";status": 200,
    "content-type": "audio/raw",
  });
}

const sd = createSecureServer(require("./tls").httpTLS);

sd.on("stream", handleStream);
sd.listen(8443); //, handleStream);a
