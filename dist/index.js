"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const load_sort_midi_1 = require("./load-sort-midi");
const path_1 = require("path"); //   output: process.stdout,
const fs_1 = require("fs");
const stream_1 = require("stream");
const indexHtml = fs_1.readFileSync(path_1.resolve(__dirname, "../index.html"));
const httpd = require("http").createServer(async (req, res) => {
    const file = path_1.resolve(__dirname, "../Beethoven-Symphony5-1.mid");
    const [comma, rm, eventstr, datastr] = [":", "\n", "event: ", "data: "];
    switch (req.url) {
        case "/":
            res.end(indexHtml);
            break;
        case "/rt":
            const tx = new stream_1.Transform({
                transform: (chunk, _, cb) => {
                    const event = chunk.slice(0, chunk.indexOf(comma));
                    const data = chunk.slice(event.byteLength + 1);
                    cb(null, [eventstr, event, rm, datastr, data, rm, rm].join(""));
                    console.log(event.toString());
                },
            });
            tx.pipe(res);
            res.writeHead(200, {
                "Content-Type": "text/event-stream",
                Connection: "keep-alive",
                "Cache-Control": "no-cache",
            });
            load_sort_midi_1.convertMidi(file, {
                output: tx,
                realtime: true,
            }, () => {
                res.end();
            });
            break;
        case "/list":
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify(fs_1.readdirSync("./csv")));
            break;
        case "/csv":
            res.writeHead(200, {
                "Content-Type": "text/csv",
                "Content-Disposition": `inline; filename="bach.csv"`,
            });
            load_sort_midi_1.convertMidi(file, {
                output: res,
                realtime: false,
            }, () => {
                res.end();
            });
            break;
        case "/html":
            res.write(`<html><body><pre>`);
            const csvname = "./csv/" + (req.query.name || "song") + ".csv";
            if (!fs_1.existsSync(csvname)) {
                await load_sort_midi_1.convertMidi(file, {
                    output: fs_1.createWriteStream(csvname),
                    realtime: false,
                });
            }
            const rs = fs_1.createReadStream(csvname);
            rs.pipe(res, { end: false });
            rs.on("ended", res.write("</pre></body></html>"));
            break;
        default:
            res.end(req.url);
            break;
    }
});
httpd.listen("8081");
function getBuffer(str, args) {
    //`${Instrument},${Midi},${start},${duration}`;
    //const pcm = `midisf/${format(Instrument)}/${Midi}`;
}
/*
  `clarinet,67,256,116
  string ensemble 1,67,256,116
  string ensemble 1,67,256,116
  string ensemble 1,55,256,116
  string ensemble 1,43,256,116
  string ensemble 1,43,256,116`
  */
//# sourceMappingURL=index.js.map