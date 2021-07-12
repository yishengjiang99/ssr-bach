function fetchxml(url, cb) {
	const xhr = new XMLHttpRequest();
	xhr.current.onerror = (e) => dispatch("error:" + e.message);
	xhr.current.open("GET", url);
	xhr.current.responseType = "document";
	xhr.current.send();
	xhr.onload = function () {
		cb(null, xhr.responseXML.documentElement);
	};
}
