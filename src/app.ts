import { h, mlist, pdtaView } from "./dist/react-light.js";
import { SF2File } from "./dist/index.js";
//	const maindiv = document.querySelector("main").appendChild(mlist());

let timer, _pdta, proc, ctx;
let playing = false;
const midiurls = ["song.mid"];

const [playBtn, stopbtn] = Array.from(document.querySelectorAll("button"));
const ch = new MessageChannel();
const cosole = document.querySelector("pre");
const div = document.querySelector("pre");
const logs = [];

const loghtml = (...entry) => {
	logs.push(entry.join("\t"));
	cosole.innerHTML = logs.join("\n");
	if (logs.length > 90) logs.shift();
};
const prog = document.querySelector("#prog progress");
ch.port1.onmessage = (e) => {
	const {
		data: {
			prog: [n, d],
			msg,
		},
	} = e;

	if (n && d) {
		prog.setAttribute("max", d + ""); // = d;
		prog.setAttribute("value", n + "");
	}
};
const sfurls = ["GeneralUserGS.sf2"];

queueMicrotask(init);
let sdta;
async function init() {
	loghtml("loading.");

	const sffile = await SF2File.fromURL("GeneralUserGS.sf2");
	sdta = sffile.sdta;
	_pdta = sffile.pdta;
	loghtml("loaded");

	playBtn.removeAttribute("disabled");
}
playBtn.addEventListener("click", async (e) => {
	if (!ctx) {
		loghtml("starting.");
		ctx = new AudioContext();
		await ctx.audioWorklet.addModule("dist/rend-proc.js");
		proc = new AudioWorkletNode(ctx, "rend-proc", {
			outputChannelCount: [2],
		});
		loghtml("got proc.");

		proc.onprocessorerror = (e) => {
			console.trace();
		};
		const procreadyWait = new Promise((resolve) => {
			proc.port.onmessage = (e) => {
				console.log(e);
				resolve();
			};
		});
		proc.port.postMessage({ samples: sdta.floatArr });
		loghtml("posting samp");
		await procreadyWait;
		await ctx.resume();
		proc.connect(ctx.destination);
		playing = true;
		loghtml("posting samp");
		timer = playMidi(midiurls[0]);
		playBtn.setAttribute("disabled", "true");
		stopbtn.setAttribute("disabled", "false");
	}
});
stopbtn.addEventListener("click", (e) => {
	playing = false;
	stopbtn.setAttribute("disabled", "true");
	playBtn.setAttribute("disabled", "false");
});

async function loadMidi(url) {
	const { durationTicks, header, tracks } = await Midi.fromUrl(url);
}
async function playMidi(url) {
	const { durationTicks, header, tracks } = await Midi.fromUrl(url);
	let t = 1;
	while (t < durationTicks && playing) {
		let output = "";
		const _t = header.secondsToTicks(t / 1000);
		const ratio = t / _t;
		for (let i = 0; i < tracks.length; i++) {
			const track = tracks[i];
			while (track.notes && track.notes[0] && track.notes[0].ticks < _t) {
				const note = track.notes.shift();
				const z = _pdta.findPreset(
					track.instrument.number,
					track.instrument.percussion ? 128 : 0,
					note.midi,
					note.velocity * 127
				);

				if (z && z[z.length - 1]) {
					proc.port.postMessage({
						zone: z[z.length - 1].serialize(),
						note: {
							midi: note.midi,
							velocity: note.velocity * 127,
							start: note.time,
							durationTime: note.durationTime,
							channelId: track.channel,
						},
					});
					//	console.log(z[0]);
				}
			}
			t += 200;
			await new Promise((r) => setTimeout(r, 200));
			if (output) div.innerHTML = output;
		}
	}
}

window.onhashchange = () => {
	midiurls[0] = "https://www.grepawk.com/ssr-bach/midi/" + location.hash.substr(1);
	playMidi(midiurls[0]);
};
