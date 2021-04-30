import { initsfbk } from "./sfbk.js";
import { Midi } from "../lib/miditone.js";
let sdta, timer, _pdta, proc, ctx;
let playing = false;
const midiurls = ["midi/serenade_k361_3rd-mid.mid"];
const workletcode = URL.createObjectURL(
	new Blob([document.getElementById("workletcode").textContent], {
		type: "text/javascript",
	})
);
const [playBtn, stopbtn] = Array.from(document.querySelectorAll("button"));

export const ch = new MessageChannel();
const cosole = document.createElement("pre");
document.body.append(cosole);
const logs = [];

const loghtml = (...entry) => {
	logs.push(entry.join("\t"));
	cosole.innerHTML = logs.join("\n");
	if (logs.length > 90) logs.shift();
};
const sfurls = ["GeneralUserGS.sf2"];

queueMicrotask(init);

async function init() {
	const { pdta, sdtaWait } = await initsfbk(sfurls[0], ch.port2);
	_pdta = pdta;
	sdta = await sdtaWait;
	playBtn.removeAttribute("disabled");
}

playBtn.addEventListener("click", async (e) => {
	if (!ctx) {
		loghtml("starting.");
		ctx = new AudioContext();
		await ctx.audioWorklet.addModule(workletcode);
		proc = new AudioWorkletNode(ctx, "rend-proc", {
			outputChannelCount: [2],
		});
		loghtml("got proc.");

		proc.onprocessorerror = () => {
			console.trace();
		};
		const procreadyWait = new Promise<void>((resolve) => {
			proc.port.onmessage = (e) => {
				console.log(e);
				resolve();
			};
		});
		proc.port.postMessage({ samples: sdta.buffer }, [sdta.buffer]);
		loghtml("posting samp");
		await procreadyWait;
		await ctx.resume();
		proc.connect(ctx.destination);
		playing = true;
		loghtml("posting samp");
		playMidi(midiurls[0]);
		(e.target as HTMLElement).setAttribute("disabled", "true");
		stopbtn.setAttribute("disabled", "false");
	}
});
stopbtn.addEventListener("click", () => {
	playing = false;
	stopbtn.setAttribute("disabled", "true");
	playBtn.setAttribute("disabled", "false");
});
async function loadMidi(url: string) {
	const { durationTicks, header, tracks } = await Midi.fromUrl(url);
}
async function playMidi(url) {
	const { durationTicks, header, tracks } = await Midi.fromUrl(url);

	let t = 1;
	while (t < durationTicks && playing) {
		let output = "";
		const _t = header.secondsToTicks(t / 1000);
		for (let i = 0; i < tracks.length; i++) {
			const track = tracks[i];
			while (track.notes && track.notes[0] && track.notes[0].ticks < _t + 230) {
				const note = track.notes.shift();
				const z = _pdta.findPreset(
					track.instrument.number,
					track.instrument.percussion ? 128 : 0,
					note.midi,
					note.velocity * 127
				);

				if (z && z[0]) {
					proc.port.postMessage({
						zone: z[0].serialize(),
						note: {
							midi: note.midi,
							velocity: note.velocity * 127,
							start: note.time,
							durationTime: note.durationTime,
							channelId: track.channel,
						},
					});
					console.log(z[0]);
				}
			}
			t += 200;
			// await new Promise((r) => setTimeout(r, 200));
			//	if (output) pre.innerHTML = output;
		}
	}
}
