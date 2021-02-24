"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const https_1 = require("https");
const httpd_1 = require("./httpd");
process.env.HOST = 'dsp.greawk.com';
test("connnectivity", (done) => {
    let port = 8322;
    const url = `https://${process.env.HOST}:${port}`;
    let server = new httpd_1.Server(8322, process.env.HOST);
    server.start();
    server.server.once("listening", () => {
        ["/", "/pcm", "/rt", "/samples", 'midi'].map(path => {
            testendpoint(url + path, (res) => {
                expect(res.statusCode).toBe(200);
            });
        });
        testendpoint("https://localhost:8332", function verify() {
            expect(true);
        });
    });
});
function testendpoint(endpoint, verify) {
    https_1.get(endpoint, (res) => verify);
}
