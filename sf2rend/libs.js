async function sfbkstream(url) {
	const ab = await (await fetch(url, { headers: { Range: "bytes=0-6400" } })).arrayBuffer();
	const [preample, r] = skipToSDTA(ab);
	const sdtaSize = r.get32();
	const stdstart = r.offset + 8;
	const pdtastart = stdstart + sdtaSize + 4;
	const rangeHeader = {
		headers: {
			Range: "bytes=" + stdstart + "-" + pdtastart,
		},
	};
	const pdtaHeader = {
		headers: { Range: "bytes=" + pdtastart + "-" },
	};
	const { readable, writable } = new TransformStream();
	(await fetch(url, rangeHeader)).body.pipeTo(writable);
	return {
		nsamples: (pdtastart - stdstart) / 2,
		sdtaStream: readable,
		infos: preample,
		pdtaBuffer: new Uint8Array(await (await fetch(url, pdtaHeader)).arrayBuffer()),
	};
}
function skipToSDTA(ab) {
	const infosection = new Uint8Array(ab);
	const r = readAB(infosection);
	const [riff, filesize, sig, list] = [
		r.readNString(4),
		r.get32(),
		r.readNString(4),
		r.readNString(4),
	];
	console.assert(riff == "RIFF" && sig == "sfbk");
	let infosize = r.get32();
	console.log(r.readNString(4), filesize, list, r.offset);
	console.log(infosize, r.offset);
	const infos = [];
	while (infosize >= 8) {
		const [section, size] = [r.readNString(4), r.get32()];
		infos.push({ section, text: r.readNString(size) });
		infosize = infosize - 8 - size;
	}
	console.assert(r.readNString(4) == "LIST");
	return [infos, r];
}
function readAB(arb) {
	const u8b = new Uint8Array(arb);
	let _offset = 0;
	function get8() {
		return u8b[_offset++];
	}
	function getStr(n) {
		let str = "";
		let nullterm = 0;
		for (let i = 0; i < n; i++) {
			const c = get8();
			if (c == 0x00) nullterm = 1;
			if (nullterm == 0) str += String.fromCharCode(c);
		}
		return str;
	}
	function get32() {
		return get8() | (get8() << 8) | (get8() << 16) | (get8() << 24);
	}
	const get16 = () => get8() | (get8() << 8);
	const getS16 = () => {
		const u16 = get16();
		if (u16 & 0x8000) return -0x10000 + u16;
		else return u16;
	};
	const readN = (n) => {
		const ret = u8b.slice(_offset, n);
		_offset += n;
		return ret;
	};
	function varLenInt() {
		let n = get8();
		while (n & 0x80) {
			n = get8();
		}
		return n;
	}
	const skip = (n) => {
		_offset = _offset + n;
	};
	const read32String = () => getStr(4);
	const readNString = (n) => getStr(n);
	return {
		skip,
		get8,
		get16,
		getS16,
		readN,
		read32String,
		varLenInt,
		get32,
		readNString,
		get offset() {
			return _offset;
		},
		set offset(n) {
			_offset = n;
		},
	};
}
function mkdiv(type, attr = {}, children = "") {
	const div = document.createElement(type);
	for (const key in attr) {
		if (key.match(/on(.*)/)) {
			div.addEventListener(key.match(/on(.*)/)[1], attr[key]);
		} else {
			div.setAttribute(key, attr[key]);
		}
	}
	const charray = !Array.isArray(children) ? [children] : children;
	charray.forEach((c) => {
		typeof c == "string" ? (div.innerHTML += c) : div.append(c);
	});
	return div;
}
function logdiv() {
	const logs = [];
	const errPanel = mkdiv("div");
	const infoPanel = mkdiv("pre", {
		style: "width:30em;min-height:299px;scroll-width:0;max-height:299px;overflow-y:scroll",
	});
	const stderr = (str) => (errPanel.innerHTML = str);
	const stdout = (log) => {
		logs.push((performance.now() / 1e3).toFixed(3) + ": " + log);
		if (logs.length > 100) logs.shift();
		infoPanel.innerHTML = logs.join("\n");
		infoPanel.scrollTop = infoPanel.scrollHeight;
	};
	return {
		stderr,
		stdout,
		infoPanel,
		errPanel,
	};
}
function wrapDiv(div, tag, attrs = {}) {
	return mkdiv(tag, attrs, [div]);
}
function wrapList(divs) {
	return mkdiv("div", {}, divs);
}

// @ts-ignore
const draw = function (getData, length, canvas) {
	const slider = mkdiv("input", { type: "range", value: 1, max: 10, min: -10, step: 0.2 }, []);
	let zoomScale = 1,
		zoomXscale = 1;
	const height = parseInt(canvas.getAttribute("height")) || canvas.parentElement.clientHeight;
	const width = parseInt(canvas.getAttribute("width")) || canvas.parentElement.clientWidth;
	const canvasCtx = canvas.getContext("2d");
	canvas.setAttribute("width", width + "");
	canvas.setAttribute("height", height + "");
	canvasCtx.fillStyle = "rbga(0,2,2,0.1)";
	canvasCtx.lineWidth = 1;
	canvasCtx.strokeStyle = "white";
	var dataArray = new Float32Array(length);
	var convertY = (y) => (y * height * zoomScale) / 2 + height / 2;
	canvas.parentElement.append(slider);
	canvasCtx.fillRect(0, 0, width, height);
	canvasCtx.beginPath();
	canvasCtx.moveTo(0, convertY(0));
	var t = 0;
	canvasCtx.lineWidth = 1;
	var x = 0;
	let timer;
	function draw(once = false) {
		const dataArrayOrDone = getData();
		if (dataArrayOrDone === null) {
			return;
		} else {
			dataArray = dataArrayOrDone;
		}
		var bufferLength = dataArray.length;
		canvasCtx.beginPath();
		var sum = 0;
		canvasCtx.moveTo(0, height / 2);
		canvasCtx.clearRect(0, 0, width, height);
		canvasCtx.fillStyle = `rbga(10,10,10, ${1 * 100})`;
		canvasCtx.fillRect(0, 0, width, height);
		canvasCtx.strokeStyle = "white";
		canvasCtx.lineWidth = 1;
		canvasCtx.beginPath();
		let x = 0,
			iwidth = (width / bufferLength) * zoomXscale; //strokeText(`r m s : ${sum / bufferLength}`, 10, 20, 100)
		for (let i = 0; i < bufferLength; i++) {
			canvasCtx.lineTo(x, convertY(dataArray[i]));
			x += iwidth;
		}
		canvasCtx.stroke();
		if (once) return;
		timer = requestAnimationFrame(() => draw(false));
	}
	canvas.onkeydown = (e) => {
		if (e.code == "+") zoomScale += 0.5;
	};
	function zoom(e) {
		zoomXscale = Math.pow(2, parseInt(e.target.value));
		draw(true);
	}
	slider.removeEventListener("input", zoom);
	slider.addEventListener("input", zoom);
	draw(true);
	return {
		canvas: canvas,
		stop: () => {
			clearTimeout(timer);
		},
		start: () => {
			draw();
		},
		drawOnce: () => {
			draw(true);
		},
	};
};
