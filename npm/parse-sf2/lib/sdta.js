"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.streamSF2File = void 0;
const sfbkstream_js_1 = require("./sfbkstream.js");
const pdta_js_1 = require("./pdta.js");
const aba_js_1 = require("./aba.js");
async function streamSF2File(file) {
    const { pdtaBuffer, sdtaStream, nsamples, infos } = await sfbkstream_js_1.sfbkstream(file);
    const pdta = new pdta_js_1.PDTA(aba_js_1.readAB(pdtaBuffer));
    const samplesData = pdta.shdr.map((sh, idx) => ({
        ...sh,
        sid: idx,
        izones: pdta.ibag.filter((ib) => ib.izone.sampleID == idx),
    }));
    const readable = new ReadableStream({
        async start(controller) {
            controller.enqueue(JSON.stringify(infos));
        },
    });
    let sampleIdx;
    const reader = sdtaStream.getReader();
    const floats = new Float32Array(nsamples);
    let sampleOffset = 0;
    const sampleData = [];
    function createSamplebuffer() {
        const sample = pdta.shdr[sampleOffset];
        sampleData[sampleOffset].ab = new AudioBuffer({
            numberOfChannels: 1,
            length: sample.end - sample.start,
            sampleRate: sample.sampleRate,
        });
        sampleData[sampleOffset].loop = [
            sample.startLoop - sample.start,
            sample.end - sample.end,
        ];
        const floatss = sampleData[sampleOffset].ab.getChannelData(0);
        return [floatss, floatss.length];
    }
    let [floatss, nsample] = createSamplebuffer();
    var offset = 0;
    while (true) {
        const { done, value } = await reader.read();
        if (done)
            break;
        const dv = new DataView(value.buffer);
        for (let i = 0; i < value.byteLength / 2 - 1; i++) {
            floatss[offset++] = dv.getInt16(2 * i, true) / 0x7fff; // / 0x7fff;
            if (offset >= nsample) {
                if (sampleOffset >= pdta.shdr.length)
                    return;
                [floatss, nsample] = createSamplebuffer();
                offset = 0;
            }
        }
    }
}
exports.streamSF2File = streamSF2File;
