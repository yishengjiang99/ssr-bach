"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const load_sort_midi_1 = require("./load-sort-midi");
const path_1 = require("path"); //   output: process.stdout,
const fs_1 = require("fs");
const httpd = require("http").createServer((req, res) => {
    console.log(req.url);
    switch (req.url) {
        case "/bach":
            res.writeHead(200, {
                "Content-Type": "csv/midi",
                "Content-Disposition": "inline",
            });
            const file = path_1.resolve("./Beethoven-Symphony5-1.mid");
            load_sort_midi_1.convertMidi(file, {
                output: res,
                realtime: false,
            }).then(() => res.end());
            break;
        case "/list":
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify(fs_1.readdirSync("./csv")));
            break;
        case "/bach.csv":
            res.writeHead(200, { "Content-Type": "plain/csv" });
            const filename = req.query.name || "song";
            if (fs_1.existsSync("./csv/" + filename + ".csv")) {
                fs_1.createReadStream(filename).pipe(res);
            }
            else {
                load_sort_midi_1.convertMidi(file, {
                    output: fs_1.createWriteStream(filename),
                    realtime: false,
                }).then(() => {
                    fs_1.createReadStream(filename).pipe(res);
                });
            }
            break;
    }
});
httpd.listen("8081");
//# sourceMappingURL=index.js.map