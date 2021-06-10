import { readAB } from './aba.js';
export async function sfbkstream(url) {
    const ab = await (await fetch(url, { headers: { Range: 'bytes=0-6400' } })).arrayBuffer();
    const [preample, r] = skipToSDTA(ab);
    const sdtaSize = r.get32();
    const stdstart = r.offset + 8;
    const pdtastart = stdstart + sdtaSize + 4;
    const rangeHeader = {
        headers: {
            Range: 'bytes=' + stdstart + '-' + pdtastart,
        },
    };
    const pdtaHeader = {
        headers: { Range: 'bytes=' + pdtastart + '-' },
    };
    const { readable, writable } = new TransformStream();
    (await fetch(url, rangeHeader)).body.pipeTo(writable);
    return {
        nsamples: (pdtastart - stdstart) / 2,
        sdtaStream: readable,
        infos: preample,
        pdtaBuffer: new Uint8Array(await (await fetch(url, pdtaHeader)).arrayBuffer()),
    };
}
function skipToSDTA(ab) {
    const infosection = new Uint8Array(ab);
    const r = readAB(infosection);
    const [riff, filesize, sig, list] = [
        r.readNString(4),
        r.get32(),
        r.readNString(4),
        r.readNString(4),
    ];
    console.assert(riff == 'RIFF' && sig == 'sfbk');
    let infosize = r.get32();
    console.log(r.readNString(4), filesize, list, r.offset);
    console.log(infosize, r.offset);
    const infos = [];
    while (infosize >= 8) {
        const [section, size] = [r.readNString(4), r.get32()];
        infos.push({ section, text: r.readNString(size) });
        infosize = infosize - 8 - size;
    }
    console.assert(r.readNString(4) == 'LIST');
    return [infos, r];
}
