"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.httpsTLS = void 0;
const fs_1 = require("fs");
exports.httpsTLS = {
    key: fs_1.readFileSync(process.env.PRIV_KEYFILE),
    cert: fs_1.readFileSync(process.env.CERT_FILE),
};
