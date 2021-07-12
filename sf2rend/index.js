import { readMidi, midilist } from "./midi.js";
let ctx, proc, pdta, midiWritePort, audioThreadWritePort;
let worker, clockWorker;
const { pdtaBuffer, sdtaStream, nsamples, infos } = await sfbkstream("file.sf2");

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

async function renderOffline(track, note) {}

async function startCtx() {
	try {
		ctx = new AudioContext(1, 4096, 4096);
		await ctx.audioworklet.addModule("./rendctx.js");
		proc = new AudioWorkletNode(ctx, "rend-proc", {
			outputChannelCount: [2],
		});
		stdout("proc load");
		worker = new Worker("sf2d.js");

		worker.postMessage({ pdtaBuffer }, []);
		audioThreadWritePort = new TransformStream();
		worker.postMessage(audioThreadWritePort.readable, [audioThreadWritePort.readable]);
		const audioThreadWriter = audioThreadWritePort.writable.getWriter();

		const midistream = bindMidiAccess(proc);
	} catch (e) {
		alert(e.message);
		throw e;
	}
}

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
	if (!e.target.classList.contains("midilink")) return;

	const { durationTicks, header, tracks } = await Midi.fromURL(
		decodeURIComponent(e.target.getAttribute("src"))
	);
	tracks.forEach((t) => {
		worker.postMessage({ setProgram: { channel, pid: programNumber } });
	});

	if (clockWorker) {
		clockWorker.terminate();
	}

	function onTick(){
		const timeIncrement=0.125* header.ticksPerBeat;
		const { value as events, done } = gen.next(timeIncrement);
		if (done) return;
		for (const event of events) {
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
});

let checkboxes = Array.from(document.querySelectorAll("input[type='checkbox']"));
let meters = Array.from(document.querySelectorAll("meter"));
let labels = Array.from(document.querySelectorAll("label"));

let sliders = Array.from(document.querySelectorAll("input[type='range]'"));
let dy = new Array(17).fill(0);
function animloop() {
	dy.map((vel, ch) => {
		if (vel != 0) meters[ch * 2 + 1].value = Math.min(parseInt(meters[ch * 2 + 1].value) + dy, 127);
	});

	requestAnimationFrame(animloop);
}
