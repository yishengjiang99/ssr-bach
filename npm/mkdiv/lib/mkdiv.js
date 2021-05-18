"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mkdiv = void 0;
function mkdiv(type, attr = {}, children = "") {
    const div = document.createElement(type);
    for (const key in attr) {
        if (key.match(/on(.*)/)) {
            div.addEventListener(key.match(/on(.*)/)[1], attr[key]);
        }
        else {
            div.setAttribute(key, attr[key]);
        }
    }
    const charray = !Array.isArray(children) ? [children] : children;
    charray.forEach((c) => {
        typeof c == "string" ? (div.innerHTML += c) : div.append(c);
    });
    return div;
}
exports.mkdiv = mkdiv;
//
