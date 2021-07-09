import {readMidi,midilist} from './midi.js';
let ctx, proc, pdta, midiWritePort, audioThreadWritePort;
let worker;
const { pdtaBuffer, sdtaStream, nsamples,infos } = await sfbkstream("file.sf2");

document.body.append(mkdiv('a',{target:'_blank',
href:URL.createObjectURL(new Blob(infos.map(({section,text})=>`${section}:${text}`),{type:"text/plain"}))},'license/about sf2file'));


async function startCtx() {
	try {
		ctx = new AudioContext(1,4096,4096);
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
startCtx().then(()=>{
	stdout("proc load");
	worker = new Worker("sf2d.js");

	worker.postMessage({pdtaBuffer},[]);
	 audioThreadWritePort = new TransformStream();
	 worker.postMessage(audioThreadWritePort.readable, [audioThreadWritePort.readable]);
	const audioThreadWriter = audioThreadWritePort.writable.getWriter();


	const midistream = bindMidiAccess(proc);

}).catch(e=>{
	alert(e.message);	throw e;
})

	
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

let checkboxes=Array.from(document.querySelectorAll("input[type='checkbox']"));
let meters=Array.from(document.querySelectorAll("meter"));let labels=Array.from(document.querySelectorAll("label"));

let sliders=Array.from(document.querySelectorAll("input[type='range"));
let dy= new Array(17).fill(0);
function animloop(){
  dy.map((vel,ch)=>{
    if(vel!=0) meters[ch*2+1].value = Math.min(parseInt(meters[ch*2+1].value) +dy, 127);
  })

  requestAnimationFrame(animloop)
}
