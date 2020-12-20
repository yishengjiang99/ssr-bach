import { expect } from "chai";
import { convertMidi } from "./load-sort-midi";
import { RemoteControl } from "./ssr-remote-control.types";
describe("convertMidi", () => {
  const controller: RemoteControl = convertMidi("./midi/song");
  it("converts converts midi file in real time or as a pull stream", (done) => {
    expect(controller.state.midifile).eq("./midi/song");
    expect(controller.state.paused).eq(true);
    expect(controller.state.time).eq(0);
    controller.setCallback(async (notesstarting) => {
      console.log(notesstarting);
      expect(controller.state.paused).eq(false);
      if (notesstarting && notesstarting[0].start > 10) {
        done();
      }
      return 5;
    });
    controller.start();
  });
});
