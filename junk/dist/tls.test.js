"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tls_1 = require("./tls");
test("tls", () => {
    expect(tls_1.httpsTLS.key).toBeInstanceOf(Buffer);
    expect(tls_1.httpsTLS.cert).toBeInstanceOf(Buffer);
});
