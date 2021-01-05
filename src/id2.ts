const { readable, writable } = new TransformStream();
const sliders: HTMLInputElement = document.querySelectorAll<"input">("input[type=range]");
sliders[0].oninput = (e) => writable.write(e.target.id + ": " + e.target.value);
(async function _() {
  fetch("/comms", { method: "POST", body: readable });
})();
