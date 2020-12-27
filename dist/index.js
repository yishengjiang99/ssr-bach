"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.indexHtml = void 0;
const path_1 = require("path");
const fs_1 = require("fs");
const read_midi_sse_csv_1 = require("./read-midi-sse-csv");
const http_1 = require("http");
const sound_sprites_1 = require("./sound-sprites");
const child_process_1 = require("child_process");
const filelist_1 = require("./filelist");
exports.indexHtml = fs_1.readFileSync(path_1.resolve(__dirname, "../index.html"));
http_1.createServer(async (req, res) => {
    const parts = req.url.split("/");
    const p1 = parts[1];
    const p2 = parts[2] || "";
    const p3 = parts.slice(3).join("/");
    const file = (p2 && fs_1.existsSync("./midi/" + p2) && "./midi/" + p2) || "./midi/song";
    switch (p1) {
        case "":
            res.writeHead(200, { contentType: "text/html" });
            res.write(`<!doctype html><html><head><style> ${style}</style><body>
            <div id='header' class='mt-125'> <a class='mocha' href='/bach/pcm'>dot dot dot dash</a></div>
            <script type='module' src='https://www.grepawk.com/bach/js/bundle.js'></script> `);
            res.end("</body></html>");
            break;
        case "samples":
            res.write("<html><head><style>  " + style + "</style><body>");
            filelist_1.renderlist(res);
            filelist_1.notelist(res);
            res.end(`<script type='module' src='https://www.grepawk.com/bach/js/bundle.js'></script> ` +
                "</body></html>");
            break;
        case "js":
            let jsn;
            if (p2 === "node_modules") {
                jsn = path_1.resolve(__dirname, "../js/node_modules", p3);
            }
            else {
                jsn = path_1.resolve(__dirname, "../js/build", p2);
            }
            console.log(jsn);
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
        case "pcm":
            res.writeHead(200, {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "audio/raw",
                "Cache-Control": "no-cache",
            });
            sound_sprites_1.produce(file, res);
            break;
        case "notes":
            if (!fs_1.existsSync("./midisf/" + p2 + "/" + p3 + ".pcm"))
                res.writeHead(404);
            res.writeHead(200, { "Content-Type": "audio/raw" });
            const filename = "./midisf/" + p2 + "/" + p3 + ".pcm";
            child_process_1.spawn("ffmpeg", `-f f32le -ar 48000 -ac 1 -i ${filename} -af volume=0.5 -f f32le -ac 2 -ar 48000 -`.split(" ")).stdout.pipe(res);
            // createReadStream("./midisf/" + p2 + "/" + p3 + ".pcm").pipe(res);
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
}).listen(8081);
const style = `
 .mt-125{
  margin-top:215px;
  padding-bottom:215px;

  align-content:center;
  text-align:center
}
body{
  background-color:black;
  color:white;
  font-size:1.1em;
  
}
.playing {
  color:rgba(13,13,13,.1);
}
.playing a{
  color:rgba(13,13,13,.4);

}
a{
  color:white;
}
canvas{
  top:0;left:0;
  z-index:-2;
position:absolute;
width:100vw;
height:100vh;}`;
//# sourceMappingURL=index.js.map