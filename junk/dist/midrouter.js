"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.midrouter = void 0;
const path_1 = require("path");
const resolvebuffer_1 = require("./resolvebuffer");
const utils_1 = require("./utils");
const xplayer_1 = require("./xplayer");
const midrouter = (req, res) => {
    const filename = decodeURIComponent(path_1.resolve("midi", req.url.substring(1)));
    //decodeURIComponent(filename)
    const player = new xplayer_1.Player();
    const { state: { tracks } } = player.loadTrack(filename); //
    const bufferQueue = [];
    '';
    res.write(/* html*/ `
			<script src='./js/build/playsample.js'></script>

	<table border="1">
		${tracks.map(t => `<tr><td>${[t.name, t.instrument.name, t.channel, ...t.notes.filter(n => n.bars < 30).map(n => {
            const { offset, loop, looplength, endloop, pitchratio } = resolvebuffer_1.findIndex(t.instrument.percussion ? utils_1.std_drums[t.instrument.number] : t.instrument.number, n.midi, n.velocity);
            bufferQueue.push({ offset, loop, endloop, pitchratio, looplength });
            const url = [loop, looplength, endloop, pitchratio].join('_');
            return `<a onclick='playsample("sf/${url}")'>${n.name}</a>`;
        })].join("</td><td>")}</td></tr>`)}};
		</table>
		`);
    res.end();
};
exports.midrouter = midrouter;
//createSecureServer(require('./tls'), midrouter).listen(3004);
