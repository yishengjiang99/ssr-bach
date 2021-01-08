import { convertMidi, convertMidiASAP } from "./load-sort-midi";
import { RemoteControl } from "./ssr-remote-control.types";
test("convertMidi", () => {
  const controller: RemoteControl = convertMidiASAP("./midi/song.csv");
  controller.emitter.on("note", (data) => {});
});
