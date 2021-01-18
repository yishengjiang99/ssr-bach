import { EventEmitter } from "events";
import { Readable, Transform, Writable } from "stream";
import { convertMidi, convertMidiASAP, convertMidiRealTime } from "./load-sort-midi";
export const readMidiSSE = (
  request: Readable,
  response: Writable,
  midifile: string,
  realtime: boolean
) => {
  const { emitter, ff, start, rwd, stop, pause, resume } = convertMidiRealTime(midifile);
  request.on("close", stop);
  request.on("data", (d) => {
    const req = d.toString().trim();
    switch (req) {
      case "pause":
        pause();
        break;
      case "resume":
        resume();
        break;
      case "ff":
        ff();
        break;
      case "rwd":
        rwd();
        break;
      default:
        break;
    }
  });

  ["note", "#meta", "#time", "#tempo"].map((event) => {
    emitter.on(event, (d) => {
      response.write(
        ["event: ", event, "\n", "data: ", JSON.stringify(d), "\n\n"].join("")
      );
    });
  });
};
export const readAsCSV = (
  midifile: string | EventEmitter,
  realtime: boolean
): Readable => {
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
};
