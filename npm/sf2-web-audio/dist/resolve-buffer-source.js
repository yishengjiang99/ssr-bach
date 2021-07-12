export function getSample(shr, sdtafl) {
    const { start, end } = shr;
    const data = sdtafl.subarray(start, end);
    const loop = [shr.startLoop - shr.start, shr.endLoop - shr.start];
    function* shift(pitchRatio = 1, length = 48000) {
        let pos = 0;
        while (length-- >= 0) {
            pos = pos + pitchRatio;
            if (pos >= loop[1])
                pos = loop[0];
            yield data[pos];
        }
        return null;
    }
    return {
        data,
        loop,
        shift,
        audioBufferSrc: (ctx) => new AudioBufferSourceNode(ctx, {
            buffer: new AudioBuffer({
                numberOfChannels: 1,
                length: 48000,
                sampleRate: ctx.sampleRate,
            }),
        }),
    };
}
