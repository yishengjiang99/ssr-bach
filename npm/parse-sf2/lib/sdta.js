import { sfbkstream } from './sfbkstream.js';
import { PDTA } from './pdta.js';
import { readAB } from './aba.js';
export async function streamSF2File(file) {
    const { pdtaBuffer, sdtaStream, nsamples, infos } = await sfbkstream(file);
    const pdta = new PDTA(readAB(pdtaBuffer));
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
