import { open } from "fs";
import { resolve, basename } from "path";
import { lookup } from "mime-types";
import { ServerHttp2Stream } from "http2";
import { Readable } from "stream";

type FD = number;
export function pushFile({
  stream,
  file,
  path,
}: {
  stream: ServerHttp2Stream;
  file: string | FD | Buffer | ReadableStream;
  path: string;
}): void {
  stream.pushStream({ ":path": path }, (err, pushStream, headers) => {
    if (err)
      throw err;
    headers = {
      "content-type": lookup(basename(path)),
      ":status": 200,
    };
    switch (typeof file)
    {
      case "number":
        pushStream.respondWithFD(file, headers);
        break;
      case "string":
        open(resolve(file), "r", (err, fd) => {
          if (err)
            throw err;
          pushStream.respondWithFD(fd, headers);
        });
        break;
      case "object":
        if (file instanceof Buffer)
        {
          pushStream.respond(headers);
          pushStream.end(file);
        } else if (file instanceof Readable)
        {
          pushStream.respond(headers);
          file.pipe(pushStream);
        }
        break;
      default:
        throw `dont know how to handle ${file}`;
    }
  });
}
