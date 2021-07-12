import { parseMidi } from "./libparsemidi.js";
import { playPauseTimer } from "./runclock.js";

let checkboxes = Array.from(document.querySelectorAll("input[type='checkbox']"));
let meters = Array.from(document.querySelectorAll("meter"));
let labels = Array.from(document.querySelectorAll("label"));

let sliders = Array.from(document.querySelectorAll("input[type='range]'"));
let dy = new Array(17).fill(0);
let animationFrameTimer;
function animloop() {
	dy.map((vel, ch) => {
		if (vel != 0) {
			meters[ch * 2 + 1].value = meters[ch * 2 + 1].value * 0.9;
		}
	});

	return requestAnimationFrame(animloop);
}

let ctx, proc, ssrb, worker, clockWorker;
// const { pdtaBuffer, sdtaStream, nsamples, infos } = await sfbkstream("file.sf2");

async function renderOffline(track, note) {}
const gainEnvelopes = new Array(16);
async function startCtx() {
	try {
		ctx = new AudioContext();

		await ctx.audioWorklet.addModule("p.js");
		await ctx.pause();
		proc = new AudioWorkletNode(ctx, "rend-proc", {
			numberOfOutputs: 16,
			outputChannelCount: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
		});
		for (let i = 0; i < 16; i++) {
			gainEnvelopes[i] = new GainNode(ctx, { gain: 0 });
			proc.connect(gainEnvelopes[i], i, 0).connect(ctx.destination);
		}
		stdout("proc load");
		worker = new Worker("sf2-service/sf2d.js");
		await new Promise((resolve) => {
			worker.onmessage = ({ data: { srb, ready } }) => {
				ssrb = srb;
				resolve();
			};
		});
		worker.postMessage({ sharePort: proc.port }, [proc.port]);
		worker.postMessage({
			setProgram: { pid: 0, channel: 0 },
		});
	} catch (e) {
		alert(e.message);
		throw e;
	}
}

startCtx();
async function mkPlayPauseBtn(url) {
	const { tracks, header } = await fetch(url)
		.then((res) => res.arrayBuffer())
		.then((ab) => parseMidi(new Uint8Array(ab)));
	let bpm = header.ticksPerBeat;
	const gen = midiEventGenerator(tracks, header.ticksPerBeat / 8);

	tracks.forEach((track, idx) => {
		const pg = track.filter((t) => t.type == "programChange")[0];
		if (pg) {
			worker.postMessage({ setProgram: { channel: idx, pid: pg.value } });
			labels[idx].innerHTML = pg.value;
		}
	});

	if (clockWorker) {
		clockWorker.terminate();
	}

	function onTick() {
		const timeIncrement = 0.125 * header.ticksPerBeat;
		const { value, done } = gen.next(timeIncrement);
		console.log(value);
		if (done) return;
		for (const event of value) {
			if (!(event instanceof Array)) {
				console.log(event);
				continue;
			}
			const [a, b, c, t] = event;
			const stat = a >> 4;
			const ch = a & 0x0f;
			const key = b & 0x7f,
				vel = c & 0x7f;
			switch (stat) {
				case 0xa: //chan set
					sliders[ch * 2 + 1].value = key;
					break;
				case 0xc: //change porg
					labels[ch].innerHTML = e.programNumber + "";
					break;
				case 8:
					checkboxes[ch].removeAttribute("checked");
					meters[ch * 2].value = 0;
					meters[ch * 2 + 1].value = (vel & 0x7e) | 0x01;
					dy[ch] = -1 * vel;

					break;
				case 9:
					if (vel == 0) {
						checkboxes[ch].removeAttribute("checked");
						meters[ch * 2].value = 0;
						meters[ch * 2 + 1].value = vel & 0x7e;
						dy[ch] = 0;
						dy[ch] = -1;
					} else {
						worker.postMessage({ noteOn: { channel: ch, key, vel } });
						checkboxes[ch].setAttribute("checked", true);
						meters[ch * 2].value = key;
						meters[ch * 2 + 1].value = (vel & 0x7e) | 0x01;
						dy[ch] = vel;
					}
					break;
				default:
					break;
			}
		}
	}

	clockWorker = playPauseTimer(onTick);

	setTimeout(() => {
		clockWorker.postMessage("resume");
		animationFrameTimer = animloop();
	}, 200);
}

function* midiEventGenerator(tracks, ticksPerBeat) {
	//emit meta events to prepare for playback
	let metaBatch = [];
	for (const events of tracks) {
		while (events[0] && events[0].deltaTime == 0) {
			metaBatch.push(events.shift());
		}
	}
	yield metaBatch;
	let playbackTime = 0;
	const lookAhead = (playbackTime) => playbackTime + 0.25 * ticksPerBeat;
	const trackTime = tracks.map((t) => 0);

	while (true) {
		let batch = [];
		for (let i = 0; i < tracks.length; i++) {
			const events = tracks[i];
			if (!events || events.length == 0) {
				tracks.slice(i, 1);
				continue;
			}
			if (trackTime[i] + tracks[i][0][3] <= lookAhead(playbackTime)) {
				trackTime[i] += tracks[i][0][3];
				tracks[i][0][3] = trackTime[i] - playbackTime;
				batch.push(tracks[i].shift());
			}
		}
		if (tracks.length) playbackTime += yield batch;
		else return batch;
	}
}

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
	const fileList = xmlfiles
		.map(function (b) {
			var ff = new Map();
			xml_attr.forEach(function (attr) {
				ff.set(attr, b.querySelector(attr).textContent);
			});
			return ff;
		})
		.sort(function (a, b) {
			return new Date(a.LastModified) < new Date(b.lastModified) ? -1 : 1;
		})
		.map((f) =>
			mkdiv("li", [
				f.get("Name"),
				mkdiv(
					"a",
					{
						href: "#",
						onclick: (e) => {
							e.target.innerHTML = "loading..";
							mkPlayPauseBtn(f.get("Url"));
						},
						style: "cursor:pointer",
					},
					["&nbsp;PLAY"]
				),
			])
		);

	document.querySelector("#filemenu").append(mkdiv("ul", fileList));
}
