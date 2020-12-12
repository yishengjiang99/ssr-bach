import { readdirSync } from "fs";

require("http")
  .createServer((req, res) => {
    res.writeHead(200);
    res.write("dd'");
    const [_, instrument, midi] = req.url.split("/");
    if (instrument && !midi) {
    } else {
      readdirSync("../midisf").map((n) => {
        process.stdout.write(`<div>${instrument}</div>`);
      });
    }
    res.end();
  })
  .listen(8082);
