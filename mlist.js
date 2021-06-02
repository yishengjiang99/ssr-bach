import {link} from "fs";

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
export const h = (type, attr = {}, children = []) => {
	const div = document.createElement(type);
	for (const key in attr)
	{
		if (key.match(/on(.*)/))
		{
			div.addEventListener(key.match(/on(.*)/)[1], attr[key]);
		} else
		{
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
