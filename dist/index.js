"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path"); //   output: process.stdout,
const fs_1 = require("fs");
const child_process_1 = require("child_process");
const read_midi_sse_csv_1 = require("./read-midi-sse-csv");
const list_1 = require("./list");
const indexHtml = fs_1.readFileSync(path_1.resolve(__dirname, "../index.html"));
const httpd = require("http").createServer(async (req, res) => {
    const parts = req.url.split("/");
    const p1 = parts[1];
    const p2 = parts[2] || "";
    const p3 = parts[3] || "";
    const file = (p2 && fs_1.existsSync("./midi/" + p2) && "./midi/" + p2) || "./midi/song";
    switch (p1) {
        case "":
            res.end(indexHtml);
            break;
        case "js":
            const jsn = path_1.resolve(__dirname, "js/build", p2);
            if (!fs_1.existsSync(jsn)) {
                res.writeHead(404);
                res.end();
            }
            else {
                res.writeHead(200, {
                    "Access-Control-Allow-Origin": "*",
                    "Content-Type": "application/javascript",
                });
                fs_1.createReadStream(jsn).pipe(res);
            }
            break;
        case "rt":
            res.writeHead(200, {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "text/event-stream",
                Connection: "keep-alive",
                "Cache-Control": "no-cache",
            });
            read_midi_sse_csv_1.readMidiSSE(req, res, file, true);
            break;
        case "samples":
            res.writeHead(200, { contentType: "text/html" });
            res.write("<html><body>");
            list_1.notelist(res);
            res.end("</body></html>");
            break;
        case "notes":
            if (!fs_1.existsSync("./midisf/" + p2 + "/" + p3 + ".pcm"))
                res.writeHead(404);
            res.writeHead(200, { "Content-Type": "audio/raw" });
            fs_1.createReadStream("./midisf/" + p2 + "/" + p3 + ".pcm").pipe(res);
            break;
        case "list":
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify(child_process_1.execSync("ls midi/*").toString()));
            break;
        case "csv":
            res.writeHead(200, {
                "Content-Type": "text/csv",
                "Content-Disposition": `inline; filename="bach.csv"`,
            });
            read_midi_sse_csv_1.readAsCSV(file, false).pipe(res);
            break;
        default:
            res.end(p1);
            break;
    }
});
httpd.listen("8081");
//# sourceMappingURL=index.js.map