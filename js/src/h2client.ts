import { sliderDiv, stdoutPanel } from "./misc-ui";
const { stdout, printrx } = stdoutPanel(document.body);
const { readable, writable } = new TransformStream();

const slider: HTMLInputElement = document.querySelector("input");
const button: HTMLButtonElement = document.querySelector<"button">("button");
button.onclick = () => {
  const xhr = new XMLHttpRequest();
  xhr.open("CONNECT", "/");
  xhr.onreadystatechange = () => {
    printrx(`rdystate:` + xhr.readyState);
    if (xhr.response) {
      stdout(xhr.getAllResponseHeaders());
    }
  };
};
// (async function _() {
//   const resp = await fetch("/pcm", { method: "POST", body: readable });
// })();
// let writer = writable.getWriter();
// slider.oninput = (e) => {
//   writer.write([slider.id, slider.value]);
// };
