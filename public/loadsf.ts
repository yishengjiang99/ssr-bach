function loadsf(url) {
  fetch(url).then((res) =>
    res.body.pipeThrough(
      new TransformStream({
        start() {
          this.offset = 0;
        }, // required.

        async transform(chunk, controller) {
          chunk = await chunk;
        },
      })
    )
  );
}
const transformContent = {
  start() {}, // required.
  async transform(chunk, controller) {},
};
class LoadSF2File extends TransformStream {
  constructor() {
    super({ ...transformContent });
  }
}
