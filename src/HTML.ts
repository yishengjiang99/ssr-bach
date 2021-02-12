import { readFileSync } from "fs";

export type HTML = {
  header: string; beforeMain: string; afterMain: string; end: string; css: string;
};
export const hotreloadOrPreload = (url = "./index.view.html"): HTML => {
  const idx = readFileSync(url).toString();
  const header = idx.split("<style></style>")[0];
  const beforeMain = `${idx.substr(header.length).split("<main></main>")[0]}<main>`;
  const afterMain = idx.substr(header.length + beforeMain.length).split("</body>")[0];
  const end = "</body></html>";
  const css = `<style>${readFileSync("./style.css").toString()}</style>`;
  return { header, beforeMain, afterMain, end, css };
};
