import { spawn } from "child_process";
import { readdirSync } from "fs";
import { Player } from "./player";
import { devnull, nc80 } from "./sinks";
import { RemoteControl } from "./ssr-remote-control.types";

test("player", () => {
  const p = new Player();
  expect(p.nowPlaying).toBe(null);

  p.playTrack("./midi/song.mid", devnull(), false);
  expect(p.nowPlaying.state.tracks.length).toBeGreaterThan(0);
  expect(p.nowPlaying.state.time).toBe(0);

  //expect(p.timer).toBe(false);
  afterEach(() => {
    p.nowPlaying.stop();
    p.output.end();
    p.stop();
  });
});
let ctx;

test("playing", () => {
  const p = new Player();

  p.playTrack("./mid/song.mid", devnull(), true, 1);
  let t = setInterval(() => {
    if (p.nowPlaying.state.time > 11) clearTimeout(t);
    p.ctx.inputs.map((s) => console.log);
    p.tracks
      .filter((t, i) => t && t.buffer && t.buffer.byteLength >= p.ctx.blockSize)
      .map((t, i) => {
        console.log(" ".repeat(t.note.midi - 21) + i);
      });
  }, 250);

  let rc: RemoteControl = p.nowPlaying;
  console.log(rc.state.tracks);
  rc.start();
});
