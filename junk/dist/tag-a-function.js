"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tagFunction = void 0;
const tagFunction = (fn) => {
    return function tag(str, ...args) {
        for (const i in args) {
            fn(str[i]);
            fn(args[i]);
        }
        fn(str[str.length - 1]);
    };
};
exports.tagFunction = tagFunction;
