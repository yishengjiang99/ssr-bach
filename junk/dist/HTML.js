"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hotreloadOrPreload = void 0;
const fs_1 = require("fs");
const hotreloadOrPreload = (url = "./index.view.html") => {
    const idx = fs_1.readFileSync(url).toString();
    const header = idx.split("<style></style>")[0];
    const beforeMain = `${idx.substr(header.length).split("<main></main>")[0]}<main>`;
    const afterMain = idx.substr(header.length + beforeMain.length).split("</body>")[0];
    const end = "</body></html>";
    const css = `<style>${fs_1.readFileSync("./style.css").toString()}</style>`;
    return { header, beforeMain, afterMain, end, css };
};
exports.hotreloadOrPreload = hotreloadOrPreload;
