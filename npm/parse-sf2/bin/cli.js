#!/usr/bin/env node
const Fs = require("fs");
const Path = require("path");
const Readable = require("stream").Readable;
const libroot = Path.resolve(__dirname, "../lib");
const { SF2File } = require(Path.resolve(libroot, "sffile.js"));

const fname = process.argv[2] || Path.resolve(__dirname, "../GeneralUserGS.sf2");
const sffile = new SF2File(new Uint8Array(Fs.readFileSync(fname)));
if (!sffile) {
	console.log(fname, "notfound");
}
const b = sffile.pdta.phdr.filter((p) => p.bankId == 0).sort((a, b) => a.presetId - b.presetId);
function pronpt() {
	process.stdout.write("\n*(Q)uit, (N)ext, (Anykey)>\n");
}
async function presetIter(cb) {
	let i = 0;
	while (b.length) {
		const p = b.shift();
		process.stdout.write("\n" + p.presetId + `: ${p.name}\t`);
		if (i++ % 20 == 19) {
			pronpt();
			await cb();
		}
	}
}

presetIter(async () => {
	let input;
	while (input != "q") {
		input = await new Promise((resolve) =>
			process.stdin.on("data", (d) => resolve(d.toString().trim()))
		);
		if (input == "q") process.exit();
		else if (!isNaN(parseInt(input))) {
			process.stdout.write("downloading " + input + "\n");
			downloadPreset(parseInt(input), 0);
			pronpt();
		} else {
			break;
		}
	}
});

async function awaitStdin() {
	await new Promise((resolve) => {
		process.stdin.on("data", (d) => resolve(d));
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
