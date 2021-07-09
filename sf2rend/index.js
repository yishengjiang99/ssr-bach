import { readMidi, midilist } from "./midi.js";
import { playPauseTimer } from "./runclock.js";
let ctx, proc, pdta, midiWritePort, midiEventChannel;
let worker, clockWorker;
const { pdtaBuffer, sdtaStream, nsamples, infos } = await sfbkstream("file.sf2");
let checkboxes = Array.from(document.querySelectorAll("input[type='checkbox']"));
let meters = Array.from(document.querySelectorAll("meter"));
let labels = Array.from(document.querySelectorAll("label"));

let sliders = Array.from(document.querySelectorAll("input[type='range"));
let dy = new Float32Array(17).fill(0);
let y = new Float32Array(32).fill(0.0);
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
		worker.postMessage({ setPid: { channel, pid: programNumber } });
	} else if (type == "noteOn" && noteNumber) {
		console.log(
			channel,
			type,
			trackTime,
			noteNumber,
			velocity,
			programNumber,
			controllerType,
			value
		);
		worker.postMessage({ noteOn: { channel, key: noteNumber, vel: velocity } });
	}
}
document.body.append(
	mkdiv(
		"a",
		{
			target: "_blank",
			href: URL.createObjectURL(
				new Blob(
					infos.map(({ section, text }) => `${section}:${text}`),
					{ type: "text/plain" }
				)
			),
		},
		"license/about sf2file"
	)
);
const ttye = (str) => (document.querySelector("pre").innerHTML += str + "\r\n");

async function startCtx() {
	try {
		ctx = new AudioContext(1, 4096, 4096);
		await ctx.audioworklet.addModule("./rendctx.js");
		proc = new AudioWorkletNode(ctx, "rend-proc", {
			outputChannelCount: [2],
		});
	} catch (e) {
		// if (ctx && ctx.state == "suspended") {
		// 	/* ignore */
		// } else {
		// 	throw e;
		// }
	}
}
startCtx()
	.then(() => {
		stdout("proc load");
		worker = new Worker("sf2d.js");

		worker.postMessage({ pdtaBuffer }, []);
		midiEventChannel = new TransformStream();
		worker.onmessage = (e) => console.log(e.data);
		worker.postMessage(midiEventChannel.readable, [midiEventChannel.readable]);
		const audioThreadWriter = midiEventChannel.writable.getWriter();

		const midistream = bindMidiAccess(midiEventChannel.writable);
	})
	.catch((e) => {
		alert(e.message);
		throw e;
	});

function bindMidiAccess(port) {
	navigator.requestMIDIAccess().then(
		(midiAccess) => {
			stdout("midi access grant");
			const midiInputs = Array.from(midiAccess.inputs.values());
			const midiOutputs = Array.from(midiAccess.outputs.values());

			for (const output of midiOutputs) {
				midiWritePort = output;
			}

			for (const input of midiInputs) {
				input.onmidimessage = (e) => {
					stdout(input.name + ": " + e.message);
					port.postMessage({ midi: e.message });
				};
			}
			document
				.querySelector("header")
				.append(
					mkdiv("select", {}, [
						"midioutputs",
						...midiOutputs.map((o) => mkdiv("option", { value: o.id }, o.name)),
					])
				);
			document
				.querySelector("header")
				.append(
					mkdiv("select", {}, [
						"midiiutputs",
						...midiInputs.map((o) => mkdiv("option", { value: o.id }, o.name)),
					])
				);
		},
		(err) => {
			stderr("access not granted");
		}
	);
}
midilist();
document.querySelector("aside").addEventListener("click", async (e) => {
	if (e.target.classList.contains("midilink")) {
		if (clockWorker) {
			clockWorker.terminate();
		}

		let [gen, header] = await readMidi(e.target.getAttribute("src"));
		const metas = gen != null && gen.next().value;
		document.querySelector("pre").innerHTML = "";
		for (const e of Array.from(metas)) {
			console.log(e);
			if (e.meta && e.text && e.text.length) {
				ttye(`${e.type}: ${e.text}\n`);
			} else {
				channelMsg(e);
			}
		}
		clockWorker = playPauseTimer(function callback() {
			const { value, done } = gen.next((1 / 8) * header.ticksPerBeat);
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
						labels[ch].value = e.programNumber;
						break;
					case 8:
						checkboxes[ch].removeAttribute("checked");
						meters[ch * 2].value = "0";
						dy[ch] = (-1 * Math.log(10, -1440 / 200)) / 30;
						break;
					case 9:
						if (vel == 0) {
							checkboxes[ch].removeAttribute("checked");
							meters[ch * 2].value = 0;
							dy[ch] = (Math.pow(10, -1440 / 200) - Math.pow(10, dy[ch] / 200)) / 60;
						} else {
							worker.postMessage({ noteOn: { channel: ch, key, vel } });
							checkboxes[ch].setAttribute("checked", true);
							meters[ch * 2].value = key;

							dy[ch] = 11 / (129 - vel);
						}
						break;
					default:
						break;
				}
			}
		});
	}
});

function animloop() {
	dy.map((vel, ch) => {
		if (vel != 0) {
			y[ch] += y[ch] * dy[ch];
			meters[ch * 2 + 1].value = y[ch];
		}
	});

	requestAnimationFrame(animloop);
}
animloop();
