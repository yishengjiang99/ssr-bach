#!/usr/bin/env node
const { SF2File } = require("../lib/sffile");
const Fs = require("fs");
const Path = require("path");
const Readable = require("stream").Readable;
const fname = process.argv[2] || Path.resolve(__dirname, "../GeneralUserGS.sf2");
const sffile = new SF2File(new Uint8Array(Fs.readFileSync(fname)));
if (!sffile) {
	console.log(fname, "notfound");
}
const b = sffile.pdta.phdr.filter((p) => p.bankId == 0).sort((a, b) => a.presetId - b.presetId);
const presetIter = (function* _() {
	let i = 0;
	while (b.length) {
		const p = b.shift();
		process.stdout.write("\n" + p.presetId + `: ${p.name}\t`);
		if (i++ % 20 == 0) {
			process.stdout.write("\n>");
			yield;
		}
	}
})();
for (const a of presetIter) {
	const input = awaitStdin().toString().trim();
	if (input == "q") process.exit();
	else if (parseInt(input) != NaN) {
		process.stdout.write("downloading " + input + "\n");
		downloadPreset(parseInt(input), 0);
	} else {
	}
}
async function awaitStdin() {
	await new Promise((resolve) => {
		process.stdin.on("data", resolve);
	});
}
function downloadPreset(pid, bankid) {
	const pheader = sffile.pdta.phdr.filter((p) => p.presetId == pid && p.bankId == bankid);
	if (!pheader[0]) {
		console.log(pid, bankid, "notfound");
		return;
	}
	const zones = sffile.pdta.findPreset(pid, bankid);
	const dirname = `${pheader[0].name}_${pid}`; //+"_"+pid}`
	if (!Fs.existsSync(dirname)) Fs.mkdirSync(dirname);
	const meta = [];
	for (const z of zones) {
		const {
			sample: { start, rootkey, end, startLoop, endLoop, name, originalPitch, sampleRate },
			rootKey,
			modEnv,
			keyRange,
			velRange: { lo, hi },
		} = z.serialize();
		const fff = require("fs").createWriteStream(
			`${dirname}/${name}_${keyRange.lo}_${keyRange.hi}_${lo}_${hi}.wav`
		);
		fff.write(WAVheader(4 * end - start * 4, 2), "binary");
		fff.end(Buffer.from(sffile.sdta.floatArr).slice(start * 4, 4 * end));
		meta.push({ ...z.serialize(), file: fff.path });
		//  Fs.closeSync(`${dirname}/meta.json`);
	}
	Fs.writeFileSync(`${dirname}/meta.json`, JSON.stringify(meta, null, "\t"));
	//Fs.closeSync(`${dirname}/meta.json`);
}
function WAVheader(n, channel) {
	const buffer = new Uint8Array(44);
	const view = new DataView(buffer.buffer);
	function writeString(view, offset, string) {
		for (let i = 0; i < string.length; i++) {
			view.setUint8(offset + i, string.charCodeAt(i));
		}
	}
	/* RIFF identifier */
	writeString(view, 0, "RIFF");
	/* RIFF chunk length */
	view.setUint32(4, 36 + n * 4, true);
	/* RIFF type */
	writeString(view, 8, "WAVE");
	/* format chunk identifier */
	writeString(view, 12, "fmt ");
	/* format chunk length */
	view.setUint32(16, 16, true);
	/* sample format (raw) */
	view.setUint16(20, 0x0003, true);
	/* channel count */
	view.setUint16(22, 1, true);
	/* sample rate */
	view.setUint32(24, 48000, true);
	/* byte rate (sample rate * block align) */
	view.setUint32(28, 48000 * 8, true);
	/* block align (channel count * bytes per sample) */
	view.setUint16(32, channel * 8, true);
	/* bits per sample */
	view.setUint16(34, 32, true);
	/* data chunk identifier */
	writeString(view, 36, "data");
	/* data chunk length */
	view.setUint32(40, n * 8, true);
	return buffer;
}
