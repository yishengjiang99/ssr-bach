
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
// export const h = (type, attr = {}, children = []) => {
// 	const div = document.createElement(type);
// 	for (const key in attr)
// 	{
// 		if (key.match(/on(.*)/))
// 		{
// 			div.addEventListener(key.match(/on(.*)/)[1], attr[key]);
// 		} else
// 		{
// 			div.setAttribute(key, attr[key]);
// 		}
// 	}
// 	if (Array.isArray(children))
// 		children.forEach((c) => {
// 			typeof c == "string" ? (div.innerHTML += c) : div.appendChild(c);
// 		});
// 	else div.textContent = children;
// 	return div;
// };
export function mkdiv(
	type: string,
	attr: any = {},
	children: (string | HTMLElement)[] | HTMLElement | string = ""
): HTMLElement {
	const div = document.createElement(type);
	for (const key in attr)
	{
		if (key.match(/on(.*)/))
		{
			div.addEventListener(key.match(/on(.*)/)![1], attr[key]);
		} else
		{
			div.setAttribute(key, attr[key]);
		}
	}
	const charray = !Array.isArray(children) ? [children] : children;
	charray.forEach((c) => {
		typeof c == "string" ? (div.innerHTML += c) : div.append(c);
	});
	return div;
}
//
declare type stdcb = (str: string) => void;
declare type logdivRet = {
	stdout: stdcb;
	stderr: stdcb;
	errPanel: HTMLElement;
	infoPanel: HTMLElement;
};
export function logdiv(): logdivRet {
	const logs: string[] = [];
	const errPanel = mkdiv("div");
	const infoPanel = mkdiv("pre", {
		style:
			"width:30em;min-height:299px;scroll-width:0;max-height:299px;overflow-y:scroll",
	});
	const stderr = (str: string) => (errPanel.innerHTML = str);
	const stdout = (log: string) => {
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

export function wrapDiv(div: string | HTMLElement, tag: string, attrs = {}) {
	return mkdiv(tag, attrs, [div]);
}
export function wrapList(divs: HTMLElement[]) {
	return mkdiv("div", {}, divs);
}

function alignedForm(title: any, fields: any) {
	`<form>
  <fieldset>
    <legend>Simple form</legend>
    <div class="input-group fluid">
      <label for="username">Username</label>
      <input type="email" value="" id="username" placeholder="username">
    </div>
    <div class="input-group fluid">
      <label for="pwd">Password</label>
      <input type="password" value="" id="pwd" placeholder="password">
    </div>
    <div class="input-group vertical">
      <label for="nmbr">Number</label>
      <input type="number" id="nmbr" value="5">
    </div>
  </fieldset>
</form>`;
}
// @ts-ignore
export const draw = function (
	getData: () => Float32Array | Boolean | void,
	length: number,
	canvas: HTMLCanvasElement
) {
	const slider = mkdiv(
		"input",
		{ type: "range", value: 1, max: 10, min: -10, step: 0.2 },
		[]
	);

	let zoomScale = 1,
		zoomXscale = 1;
	const height: number =
		parseInt(canvas.getAttribute("height")!) ||
		canvas.parentElement!.clientHeight;
	const width: number =
		parseInt(canvas.getAttribute("width")!) ||
		canvas.parentElement!.clientWidth;
	const canvasCtx = canvas.getContext("2d")!;
	canvas.setAttribute("width", width + "");
	canvas.setAttribute("height", height + "");
	canvasCtx.fillStyle = "rbga(0,2,2,0.1)";
	canvasCtx.lineWidth = 1;
	canvasCtx.strokeStyle = "white";
	var dataArray = new Float32Array(length);
	var convertY = (y: number) => (y * height * zoomScale) / 2 + height / 2;
	canvas.parentElement!.append(slider);
	canvasCtx.fillRect(0, 0, width, height);
	canvasCtx.beginPath();
	canvasCtx.moveTo(0, convertY(0));
	var t = 0;
	canvasCtx.lineWidth = 1;
	var x = 0;

	let timer: number | NodeJS.Timeout;
	function draw(once = false) {
		const dataArrayOrDone = getData();
		if (dataArrayOrDone === null)
		{
			return;
		} else
		{
			dataArray = dataArrayOrDone as Float32Array;
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
		for (let i = 0; i < bufferLength; i++)
		{
			canvasCtx.lineTo(x, convertY(dataArray[i]));
			x += iwidth;
		}
		canvasCtx.stroke();
		if (once) return;
		timer = requestAnimationFrame(() => draw(false));
	}
	canvas!.onkeydown = (e) => {
		if (e.code == "+") zoomScale += 0.5;
	};
	function zoom(e: Event) {
		zoomXscale = Math.pow(2, parseInt((e.target as HTMLInputElement).value));
		draw(true);
	}
	slider.removeEventListener("input", zoom);
	slider.addEventListener("input", zoom);
	draw(true);
	return {
		canvas: canvas,
		stop: () => {
			clearTimeout(timer as number);
		},
		start: () => {
			draw();
		},
		drawOnce: () => {
			draw(true);
		},
	};
};
export const h = mkdiv;
export async function fetchAwaitBuffer(url) {
	return await (await fetch(url)).arrayBuffer();
}
function fetchXML(url, cb) {
	const xhr = new XMLHttpRequest();
	xhr.onload = () => {
		if (xhr.responseXML)
		{
			const ar = xhr.responseXML.documentElement.querySelectorAll("Url")
			cb(Array.from(ar).map(ele => ele.innerHTML))
		}
	};
	xhr.open("GET", url);
	xhr.responseType = "document";
	xhr.send();
}

export const mlist = async () => {
	return new Promise(resolve => {
		fetchXML("https://grep32bit.blob.core.windows.net/midi?resttype=container&comp=list", resolve);
	})
}

export const mk_link = (url, linkclicked) => {
	return h("a",
		{
			onclick: (e) => {
				e.preventDefault();
				e.stopPropagation();
				linkclicked(url);
			}
		}, url);
}