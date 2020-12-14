import { Readable } from "stream";
import { convertMidi } from "./load-sort-midi";
import { Filename } from "./ssr-remote-control.types";

export const readAsCSV = (midifile: Filename, realtime: boolean): Readable => {
  const { emitter } = convertMidi(midifile, realtime);
  const readable = new Readable({ read: () => "" });
  //readable.push("instrument, start, duraton, velocity, noteoff velocity\n");
  emitter.on("note", (event) => {
    const {
      midi,
      instrument,
      ticks,
      durationTicks,
      velocity,
      noteOffVelocity,
      trackId,
    } = event;
    readable.push(
      [
        ticks,
        midi,
        durationTicks,
        velocity,
        noteOffVelocity,
        instrument,
        trackId,
      ].join(",") + "\n"
    );
  });
  emitter.on("#meta", (info) => {
    readable.push("#meta, " + JSON.stringify(info) + "\n");
  });
  emitter.on("#tempo", (info) => {
    readable.push("#tempo, " + JSON.stringify(info) + "\n");
  });
  emitter.on("done", () => readable.emit("ended"));
  return readable;
};

// readAsCSV("midi/mz_332_3-mid.mid", true).pipe(process.stdout);
