"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ssr_cxt_1 = require("ssr-cxt");
const load_sort_midi_1 = require("./load-sort-midi");
const utils_1 = require("./utils");
test("ssr remote ", () => {
    const ctx = new ssr_cxt_1.SSRContext();
    const { start, state, stop, emitter, pause, resume, seek, ff } = load_sort_midi_1.convertMidi("./midi/song.mid", async (notes) => {
        await utils_1.sleep(ctx.secondsPerFrame * 100);
        emitter.once("#time", ({ seconds }) => {
            let t0 = state.time;
            expect(state.time).toBe(t0 + ctx.secondsPerFrame);
        });
        return ctx.secondsPerFrame;
    });
});
