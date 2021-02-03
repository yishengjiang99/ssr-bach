import { spawn } from "child_process";
import { readdirSync, statSync, createWriteStream } from "fs";
import { Player } from "./player";
import { devnull, nc80, tmpOutput } from "./sinks";
import { ControllerState, RemoteControl } from "./ssr-remote-control.types";
test("can load midi file", (done) => {
  const p = new Player();

  p.playTrack("./midi/song.mid", devnull(), false);
  expect(p.nowPlaying.state.tracks.length).toBeGreaterThan(0);
  expect(p.nowPlaying.state.time).toBe(0);
  p.stop();
  done();
});
test("can start and stop", (done) => {
  const p = new Player();
  p.playTrack("./midi/song.mid", devnull(), false);

  p.nowPlaying.start();
  let rcState: ControllerState = p.nowPlaying.state;
  expect(rcState.stop).toEqual(false);
  expect(rcState.paused).toEqual(false);

  setTimeout(() => {
    expect(p.nowPlaying.state.time).toBeGreaterThan(0);
    p.stop();
    expect(p.nowPlaying.state.stop).toBeTruthy();
    done();
  }, 10);
});

test("pipes out a readable", (done) => {
  const p = new Player();
  const fr = tmpOutput();
  p.playTrack("./midi/song.mid", fr, false);
  setTimeout(() => {
    expect(statSync(fr.path).size).toBeGreaterThan(p.ctx.blockSize * 4);
    p.stop();
    done();
  }, 500);
  p.nowPlaying.start();
});
