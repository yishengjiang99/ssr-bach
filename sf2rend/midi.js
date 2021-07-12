import "https://unpkg.com/@tonejs/midi@2.0.27/build/Midi.js";

const readState = {
	readMThd: 0001,
	readMTrk: 0010,
	readCmd: 0100,
};
function midiFileToRealTimeEmulator(ab) {
	const arr = new Uint8Array(ab);
	let i = 0,
		l = arr.length;
	const nc = () => arr[i++];
	const n16 = () => (nc() << 8) | nc();
	const fourCC = (a, b, c, d) => (a << 24) | (b << 16) | (c << 8) | d;
	const n32 = () => fourCC(nc(), nc(), nc(), nc());
	const isFourCC = (str) =>
		nc() == str.shift() && nc() == str.shift() && nc() == str.shift() && nc() == str.shift();

	const state = {
		header: {
			fileLength: 0,
			format: 1,
			ppq: 255,
			ntracks: 0,
			tempo: 60,
			timeSigature: [4, 4],
		},
		channels: new Array(16).fill({
			midi: 0,
			program: 0,
			velocity: 0,
			pitchBend: 0,
			aftertouch: 0,
		}),
	};
	if (isFourCC("MThd")) {
		state.fileLength = n32();
	}
}
function* midiEventGenerator(tracks, header, port) {
	let playbackTime = 0;
	const lookAhead = (playbackTime) => playbackTime + header.ticksPerBeat * 4;
	const trackTime = tracks.map((t) => 0);

	while (true) {
		let batch = [];
		for (let i = 0; i < tracks.length; i++) {
			const events = tracks[i];
			if (!events || events.length == 0) {
				tracks.slice(i, 1);
				continue;
			}
			if (trackTime[i] + tracks[i][0].deltaTime <= playbackTime + header.ticksPerBeat * 4) {
				trackTime[i] += tracks[i][0].deltaTime;
				batch.push({ trackTime: trackTime[i], ...tracks[i].shift() });
			}
		}
		if (tracks.length) playbackTime += yield batch;
		else return batch;
	}
}

export async function readMidi(url, port) {
	const { durationTicks, header, tracks } = await Midi.fromUrl(url);
	let bpm = header.tempos[0].bpm;
	return {
		gen,
		header,
		durationTicks,
		bpm,
	};
}
export function midilist() {
	// import { readMidi } from "midiread";
	// import * as webmidi from "webmidi";
	var url = "https://grep32bit.blob.core.windows.net/midi?resttype=container&comp=list";
	var main = document.querySelector("main");
	var xhr = new XMLHttpRequest();
	xhr.open("GET", url);
	xhr.responseType = "document";
	xhr.send();
	xhr.onload = function () {
		loadxml(null, xhr.responseXML.documentElement);
	};
	var xml_attr = [
		"Name",
		"Url",
		"LastModified",
		"Etag",
		"Size",
		"ContentType",
		"ContentEncoding",
		"ContentLanguage",
	];

	function loadxml(err, doc) {
		if (err) return;
		var aside = document.querySelector("aside");

		var xmlfiles = Array.from(doc.querySelectorAll("Blob"));
		const ff = xmlfiles.map(function (b) {
			var ff = new Map();
			xml_attr.forEach(function (attr) {
				ff.set(attr, b.querySelector(attr).textContent);
			});
			return ff;
		});
		ff.sort(function (a, b) {
			return new Date(a.LastModified) < new Date(b.lastModified) ? -1 : 1;
		});

		ff.forEach(function (a) {
			aside.innerHTML +=
				"<li>" +
				a.get("Name") +
				" (" +
				a.get("Size") +
				") - <a class='midilink' src='" +
				encodeURIComponent(a.get("Url")) +
				"' href='#" +
				encodeURI(a.get("Url").split("/").reverse().shift()) +
				"'>Play</a></li>";
		});
	}
}
