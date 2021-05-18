export async function renderOffline(zone, audioBuffer, sffile) {
    return new Promise((resolve) => {
        const sr = zone.sample.sampleRate;
        const nchannels = zone.sample.sampleType == 4 ? 2 : 1;
        const ctx = new OfflineAudioContext(nchannels, 1 * sr, sr);
        //ctx.pipe(nchannels);
    });
}
