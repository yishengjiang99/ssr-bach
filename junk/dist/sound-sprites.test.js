"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ssr_cxt_1 = require("ssr-cxt");
const stream_1 = require("stream");
const player_1 = require("./player");
const sinks_1 = require("./sinks");
const assert = require("assert").strict;
const ctx = new ssr_cxt_1.SSRContext({
    nChannels: 1,
    bitDepth: 32,
    sampleRate: 48000,
    fps: 375,
});
test("new player class (wrapped existing code to get more organized", (done) => {
    jest.mock("ssr-cxt");
    let ctx2 = new ssr_cxt_1.SSRContext();
    ctx2.pump = jest.fn(() => true);
    let p = new player_1.Player();
    p.playTrack("./midi/song.mid", sinks_1.ffp());
    expect(p.nowPlaying.state.paused).toBe(false);
    setTimeout(() => {
        expect(p.nowPlaying.state.time).toBeGreaterThan(0.05);
        p.stop();
        done();
    }, 111);
});
test("control player with function calls to seek resume stop pause start", (done) => {
    let ctx2 = new ssr_cxt_1.SSRContext();
    ctx2.pump = jest.fn(() => true);
    let p = new player_1.Player();
    p.playTrack("./midi/song.mid", new stream_1.PassThrough(), false);
    let rc = p.nowPlaying;
    rc.seek(13);
    expect(rc.state.time).toBe(13);
    rc.emitter.once("note", (note) => {
        expect(note.start).toBeGreaterThan(12);
        rc.stop();
        ctx2.stop();
        done();
    });
    expect(p.nowPlaying.state.paused).toBe(true);
    setTimeout(() => {
        expect(p.nowPlaying.state.time).toBeGreaterThan(12);
        done();
    }, 80);
});
test("48000hz/32bit/2", () => {
    assert(ctx.blockSize % 4 === 0);
});
test("never priest out NaN", () => {
    ctx.once("data", (d) => {
        assert(d instanceof Buffer);
        for (let f = d.readFloatLE(0); d.byteLength >= 4; d = d.slice(4)) {
            assert(!isNaN(f));
        }
    });
    ctx.pump();
});
test("never priest out NaN", () => {
    ctx.once("data", (d) => {
        expect(d).toBeInstanceOf(Buffer); // instanceof Buffer);
        for (let f = d.readFloatLE(0); d.byteLength >= 4; d = d.slice(4)) {
            expect(isNaN(f)).toBeFalsy(); //(!isNaN(f));
        }
    });
    ctx.pump();
});
