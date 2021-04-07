function loadsf(url) {
    fetch(url).then((res) => res.body.pipeThrough(new TransformStream({
        start() {
            this.offset = 0;
        },
        async transform(chunk, controller) {
            chunk = await chunk;
        },
    })));
}
const transformContent = {
    start() { },
    async transform(chunk, controller) { },
};
class LoadSF2File extends TransformStream {
    constructor() {
        super({ ...transformContent });
    }
}
