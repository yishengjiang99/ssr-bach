import { resolve } from "path";
import { findIndex } from "./resolvebuffer";
import { BufferIndex } from "./ssr-remote-control.types";
import { std_drums } from "./utils";
import { Player } from "./xplayer";
export const midrouter = (req, res) => {
	const filename = decodeURIComponent(resolve("midi", req.url.substring(1)));
	//decodeURIComponent(filename)
	const player = new Player();
	const { state: { tracks } } = player.loadTrack(filename); //
	const bufferQueue = []; ''
	res.write(/* html*/ `
			<script src='./js/build/playsample.js'></script>

	<table border="1">
		${tracks.map(t => `<tr><td>${[t.name, t.instrument.name, t.channel,
	...t.notes.filter(n => n.bars < 30).map(n => {
		const { offset, loop, looplength, endloop, pitchratio }: BufferIndex = findIndex(t.instrument.percussion ? std_drums[t.instrument.number] : t.instrument.number, n.midi, n.velocity);
		bufferQueue.push({ offset, loop, endloop, pitchratio, looplength });
		const url = [loop, looplength, endloop, pitchratio].join('_');
		return `<a onclick='playsample("sf/${url}")'>${n.name}</a>`
	})].join("</td><td>")}</td></tr>`)}};
		</table>
		`)
	res.end();
};

//createSecureServer(require('./tls'), midrouter).listen(3004);

