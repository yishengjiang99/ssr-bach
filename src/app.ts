import { SF2File } from "../npm/parse-sf2/dist/index.js";
import { readMidi } from "../midiread/esm/midiread.js";
import { fetchAwaitBuffer } from "./react-light.js";

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

	if (n && d)
	{
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
	if (!ctx)
	{
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
				resolve(proc);
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
	readMidi(new Uint8Array(await fetchAwaitBuffer(url)));
}
async function playMidi(url) {
	const reader = readMidi(new Uint8Array(await fetchAwaitBuffer(url)));
	const track = {};
	const programs = [];

	reader.callback = (cmd, obj, time) => {
		switch (cmd)
		{
			case "noteOff":

			case "noteOn":
				const z = _pdta.findPreset(track, obj.channel == 9 ? 128 : 0, obj.note, obj.vel);
				proc.port.postMessage({ zone: z, note: obj }); //, note.velocity * 127);
				break;

			case "Program":
				programs[obj.channel] = obj.program;
				break;
		}
	};
	reader.start();

}

window.onhashchange = () => {
	midiurls[0] = "https://www.grepawk.com/ssr-bach/midi/" + location.hash.substr(1);
	playMidi(midiurls[0]);
};
