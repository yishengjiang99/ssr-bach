import { generatorNames, keys88 } from "./sf.types.js";
import { std_inst_names } from "./utilv1.js";

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
export const h = (type, attr = {}, children = []) => {
	const div = document.createElement(type);
	for (const key in attr) {
		if (key.match(/on(.*)/)) {
			div.addEventListener(key.match(/on(.*)/)[1], attr[key]);
		} else {
			div.setAttribute(key, attr[key]);
		}
	}
	if (Array.isArray(children))
		children.forEach((c) => {
			typeof c == "string" ? (div.innerHTML += c) : div.appendChild(c);
		});
	else div.textContent = children;
	return div;
};

export async function fetchAwaitBuffer(url) {
	return await (await fetch(url)).arrayBuffer();
}
function fetchXML(url, cb) {
	const xhr = new XMLHttpRequest();
	xhr.onload = () => {
		xhr.responseXML && cb(xhr.responseXML.documentElement.querySelectorAll("Url"));
	};
	xhr.open("GET", url);
	xhr.responseType = "document";
	xhr.send();
}

export const mlist = () => {
	fetchXML("https://grep32bit.blob.core.windows.net/midi?resttype=container&comp=list", (list) => {
		h(
			"main",
			{ class: "menu" },
			list.map((f) => `<li><a href='#/${f.Url}'>${f.name}</a></a>`)
		);
	});
};

export const pdtaView = (_pdta) => {
	const div = h("pre");

	for (const presetId of [
		"acoustic_grand_piano",
		"bright_acoustic_piano",
		"electric_grand_piano",
		"honkytonk_piano",
		"marimba",
		"xylophone",
		"tubular_bells",
		"drawbar_organ",
		"percussive_organ",
		"rock_organ",
		"church_organ",
		"reed_organ",
		"accordion",
		"harmonica",
		"tango_accordion",
		"acoustic_guitar_nylon",
		"acoustic_guitar_steel",
		"electric_guitar_jazz",
		"electric_guitar_clean",

		"overdriven_guitar",
		"distortion_guitar",
		"guitar_harmonics",
		"acoustic_bass",

		"slap_bass_1",

		"synth_bass_1",
		"synth_bass_2",
		"violin",
		"viola",
		"cello",
	].map((str) => std_inst_names.indexOf(str))) {
		const phr = _pdta.phdr.filter((p, idx) => presetId == p.presetId && p.bankId == 0)?.shift();

		if (!phr) continue;
		const citty_css = `display:grid;grid-template-rows:1fr 4fr 1 fr;`;
		div.innerHTML += `<div style='${citty_css}'>
    <div>${phr.name}-${phr.presetId}</div>`;
		for (const speed in ["fast", "mid", "slow"]) {
			div.innerHTML += speed;
			const vel = speed == "fast" ? 110 : speed == "mid" ? 77 : 43;
			const { insts } = _pdta.findPreset(phr.presetId, 0, -1, vel);
			for (const inst of insts) {
				div.innerHTML += inst.name;
				inst.izones.forEach(
					(z) =>
						(div.innerHTML += `
                <a href='sample/${z.sampleID}/'>${_pdta.shdr[z.sampleID]?.name}</a>`)
				);
			}
		}
	}

	return div;
};
