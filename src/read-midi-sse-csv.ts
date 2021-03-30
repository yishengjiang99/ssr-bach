import { EventEmitter } from "events";
import { createWriteStream } from "fs";
import { Readable, Transform, Writable } from "stream";

import { convertMidi, convertMidiASAP, convertMidiRealTime } from "./load-sort-midi";
export const readMidiSSE = ({
  request,
  response,
  midifile,
  realtime,
}: {
  request?: Readable;
  response: Writable;
  midifile: string;
  realtime: boolean;
}) => {
  const rc = convertMidiRealTime(midifile);

  ["note", "#meta", "#time", "#tempo"].map((event) => {
    rc.emitter.on(event, (d) => {
      response.write(
        ["event: ", event, "\n", "data: ", JSON.stringify(d), "\n\n"].join("")
      );
    });
  });
  return rc;
};
export function readAsCSV(midifile: string | EventEmitter): Readable {
  let emitter, rc;
  if (typeof midifile !== "string") {
    emitter = midifile;
  } else {
    rc = convertMidiASAP(midifile as string);
    emitter = rc.emitter;
  }
  rc.start();
  const readable = new Readable({ read: () => "" });
  emitter.on("note", (event) => {
    const {
      midi,
      name,
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
        name,
        durationTicks,
        velocity * 127,
        noteOffVelocity * 127,
        instrument,
        trackId,
        instrument,
      ].join(",") + "\n"
    );
  });
  emitter.on("#meta", (info) => {
    readable.push("#meta, " + JSON.stringify(info) + "\n");
  });
  emitter.on("#tempo", (info) => {
    readable.push("#tempo, " + JSON.stringify(info) + "\n");
  });
  emitter.on("ended", () => readable.emit("end"));

  return readable;
}
const fp = createWriteStream("./cc.csv");
readAsCSV("midi/song.mid").on("data", (d) => fp.write("m" + d.toString()));
