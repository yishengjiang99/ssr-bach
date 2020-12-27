import { stdoutPanel, cdiv } from "./misc-ui.js";

export const start = () => {
  const { stdout, rx1 } = stdoutPanel(document.body);
  // stdout("hello");
  // const mainlist = document.querySelector("ul#main");
  // const xhr = new XMLHttpRequest();
  // xhr.open("GET", "/list", true);
  // xhr.responseType = "json";
  // xhr.onload = () => {
  //   if (xhr.response) {
  //     JSON.parse(xhr.response);
  //   }
  // };
};
start();
