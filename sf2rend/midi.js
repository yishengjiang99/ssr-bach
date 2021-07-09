import { parseMidi } from "./libparsemidi.js";

const ttye = (str) => (document.querySelector("pre").innerHTML += str + "\r\n");

function* midiEventGenerator(tracks, header) {
	//emit meta events to prepare for playback
	let metaBatch = [];
	for (const events of tracks) {
		while (events[0] && events[0].deltaTime == 0) {
			metaBatch.push(events.shift());
		}
	}
	yield metaBatch;
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
	const { tracks, header } = await fetch(filehost + document.location.hash.substr(1))
		.then((res) => res.arrayBuffer())
		.then((ab) => parseMidi(new Uint8Array(ab)));
	let bpm = header.ticksPerBeat;
	const gen = midiEventGenerator(tracks, header);

	function channelMsg({
		channel,
		type,
		trackTime,
		noteNumber,
		velocity,
		programNumber,
		controllerType,
		value,
	}) {
		if (type == "programChange" && programNumber) {
			sfWorker.postMessage({ setPid: { channel, pid: programNumber } });
		} else if (type == "noteOn" && noteNumber) {
			//console.log(channel, type, trackTime,noteNumber,velocity,programNumber,controllerType,value)
			sfWorker.postMessage({ noteOn: { channel, note: noteNumber } });
		}
	}
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
		function fetchmidi() {}

		ff.forEach(function (a) {
			document.body.innerHTML +=
				"<li>" +
				a.get("Name") +
				" (" +
				a.get("Size") +
				") - <a onclick=fetchmidi('" +
				a.get("Url") +
				"'), '" +
				a.get("Name") +
				"') href='midi.html#" +
				encodeURI(a.get("Url").split("/").reverse().shift()) +
				"'>Play</a></li>";
		});
	}
}
