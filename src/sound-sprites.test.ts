import { SSRContext } from "ssr-cxt";
import { convertMidiASAP } from "./load-sort-midi";
import { produce } from "./sound-sprites";
import { PassThrough } from "stream";
import { NoteEvent } from "./ssr-remote-control.types";
import { expect } from "chai";
const assert = require("assert").strict;

describe("48000hz/32bit/2", () => {
  const spriteBytePeSecond = 48000 * 1 * 4;
  const ctx = new SSRContext({
    nChannels: 1,
    bitDepth: 32,
    sampleRate: 48000,
    fps: 375,
  });
  it("it its blocksize is multiple of 4", () => {
    assert(ctx.blockSize % 4 === 0);
  });
  it("never priest out NaN", () => {
    ctx.on("data", (d) => {
      assert(d instanceof Buffer);
      for (let f = d.readFloatLE(0); d.byteLength >= 4; d = d.slice(4)) {
        assert(!isNaN(f));
      }
    });
    ctx.pump();
  });
  it("event with real data", () => {
    const pt = new PassThrough();

    pt.on("data", (d) => {
      // console.log(d.byteLength);
      for (let f = d.readFloatLE(0); d.byteLength >= 4; d = d.slice(4)) {
        expect(!isNaN(f)).to.be.true;
        // console.log(f);
      }
    });
    produce("song.mid", pt);
  });
});
