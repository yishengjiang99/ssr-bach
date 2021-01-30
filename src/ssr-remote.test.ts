import { SSRContext } from "ssr-cxt";
import { convertMidi } from "./load-sort-midi";

import { sleep } from "./utils";

test("ssr remote ", () => {
  const ctx = new SSRContext();
  const { start, state, stop, emitter, pause, resume, seek, ff } = convertMidi(
    "./midi/song.mid",
    async (notes) => {
      await sleep(ctx.secondsPerFrame * 100);
      emitter.once("#time", ({ seconds }) => {
        let t0 = state.time;
        expect(state.time).toBe(t0 + ctx.secondsPerFrame);
      });
      return ctx.secondsPerFrame;
    }
  );
});
