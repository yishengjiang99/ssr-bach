import { load_proc_controller } from "./proccontroller.js";
import { logdiv, mkdiv } from "https://unpkg.com/mkdiv@2.0.1/src/index.js";
const { stdout, stderr } = logdiv({ containerID: "stdout" });
stdout("pgload");
const [filelist, inputlist, outputlist] = [
	mkdiv("td", { id: "filelist" }, ["FileSources:"]),
	mkdiv("td", { id: "outputlist" }, ["Send To:"]),
	mkdiv("td", { id: "inputlist" }, ["Playback from:"]),
];
const statediv = document.querySelector("#sfdiv");
document
	.querySelector("#table")
	.append(
		mkdiv("table", { border: 1, valign: "top" }, [
			mkdiv("tr", {}, [filelist, inputlist, outputlist]),
		])
	);
let audioCtx, proc, pdta, midiWritePort, audioThreadWritePort;

(async function gratuitous_functionname_for_async_await() {
	try {
		audioCtx = new AudioContext();
	} catch (e) {
		if (audioCtx && audioCtx.state == "suspended") {
			/* ignore */
		} else {
			throw e;
		}
	}
	const ret = await load_proc_controller(audioCtx, "sm.sf2", stdout, stderr);
	proc = ret.proc;
	pdta = ret.pdta;
	stdout("proc load");
	audioThreadWritePort = new TransformStream();
	proc.port.postMessage(audioThreadWritePort.readable, [audioThreadWritePort.readable]);
	audioThreadWriter = audioThreadWritePort.writable.getWriter();

	proc.onmessage = ({ stateBuffer }) => {
		stdout("statebuffer got");
	};
	const midistream = bindMidiAccess(proc);
	statediv.append(
		mkdiv(
			"select",
			{},
			pdta.phdr
				.slice(0, 10)
				.map((ph) => mkdiv("option", { value: [ph.pid | ph.bank_id] }, [ph.name]))
		)
	);
})();
function bindMidiAccess(proc) {
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
					proc.port.postMessage({ midi: e.message });
				};
			}
			const midioutputradio = midiOutputs.map((output) => {
				return mkdiv("div", {}, [
					mkdiv("input", {
						type: "radio",
						value: output.id,
						name: "outputselect",
						checked: output.id == midiWritePort.id,
						onchange: (e) => (midiWritePort = output),
					}),
					mkdiv("span", { role: "label", for: "o_" + output.id }, output.name),
				]);
			});
			outputlist.append(mkdiv("form", {}, midioutputradio));
			inputlist.append(
				mkdiv(
					"form",
					{},
					midiOutputs.map((o) => {
						return mkdiv("div", {}, [
							mkdiv("input", { type: "checkbox", checked: "checked" }),
							mkdiv("span", { role: "label", for: "o_" + o.id }, o.name),
						]);
					})
				)
			);
		},
		(err) => {
			stderr("access not granted");
		}
	);
}
var keyboard = new QwertyHancock({
	id: "keyboard",
	width: 500,
	height: 150,
	octaves: 2,
	startNote: "A3",
	whiteNotesColour: "white",
	blackNotesColour: "black",
	hoverColour: "#f3e939",
});
const keys = ["a", "w", "s", "e", "d", "f", "t", "g", "y", "h", "u", "j"];
function noteOn(note, vel) {
	if (midiinput) {
		midiinput.send;
	}
}
keyboard.keyDown = function (note, Hertz) {
	// Your code here

	noteOn((Math.log(Hertz / 440.0) / Math.log(2)) * 12 + 60);
};

keyboard.keyUp = function (note, Hertz) {
	// Your code here
	noteOff((Math.log(Hertz / 440.0) / Math.log(2)) * 12 + 60);
};
