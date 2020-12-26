import { stdoutPanel, cdiv } from "./misc-ui.js";

export const start = () => {
  const { stdout, rx1 } = stdoutPanel(document.body);
  stdout("hello");
  const mainlist = document.querySelector("ul#main");
  const ws = new WebSocket("ws://localhost:3333/song.mid");

  function onopen() {
    this.addEventListener("message", handleFilelist, { once: true });
  }
  function handleFilelist({ data }) {
    data.split("\n").map((item) => {
      mainlist.append(cdiv("li", {}, [item]));
    });
    this.addEventListener("message", handlePNG, { once: true });
  }
  function handlePNG({ data }) {
    const canv = document.createElement<"canvas">("canvas");
    canv.getContext("2d").putImageData(new ImageData(data, 88), 0, 0);
    document.body.append(canv);
    this.addEventListener("message", handleAudio, { once: true });
  }
  function handleAudio() {
    console.log("..");
  }
  ws.addEventListener("open", onopen);
};
start();
