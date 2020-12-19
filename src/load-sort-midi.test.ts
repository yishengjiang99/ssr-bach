import { expect } from "chai";
import { convertMidi } from "./load-sort-midi";

const { emitter } = convertMidi("./midi/song", true);
emitter.on("note", (d) => console.log(d));
