import { Header, Midi } from "@tonejs/midi";
import { TempoEvent, TimeSignatureEvent } from "@tonejs/midi/dist/Header";
import { EventEmitter } from "events";
import { readFileSync } from "fs";

const {
  MessageChannel,
  markAsUntransferable,
  Worker,
  isMainThread,
} = require("worker_threads");

const { port1, port2 } = new MessageChannel();

export class Ticker extends EventEmitter {
  ticks: number = 0;
  ppq: number = 256; //ticks per beat
  timer: any;
  header: Header;
  tempo: TempoEvent;
  timeSignature: number[];
  andTwoThreeFour: number = 0; //the n-th[1..4] quarter/eighth note of a measure
  measure: number = 0;
  get ticksPerBeat() {
    return (this.ppq * 4) / this.timeSignature[1]; // this.timeSignature[1];
  }
  get beatsPerMeasure() {
    return this.timeSignature[0];
  }
  get quarterNotesPerMeasure() {
    return (this.timeSignature[0] / this.timeSignature[1]) * 4;
  }
  get bpm() {
    return this.tempo.bpm;
  }
  get msPerTick() {
    // 60s / 120beats / quarterNotesPerBeat * ticks perquater note
    return 60000 / this.bpm / this.ppq;
  }
  get msPerBeat() {
    return 60000 / this.bpm;
  }

  constructor(header: Header) {
    super();
    this.header = header;
    this.ppq = header.ppq;
    this.tempo = this.header.tempos.shift();
    this.timeSignature = this.header.timeSignatures.shift().timeSignature;
    this.andTwoThreeFour = 0;

    this.emit("update", "tempo", this.timeSignature, this.tempo);
  }

  updateMetaIfNeeded() {
    let updates = 0x0;
    if (this.header.tempos[0] && this.ticks >= this.header.tempos[0].ticks) {
      this.tempo = this.header.tempos.shift();
    }
    if (
      this.header.timeSignatures[0] &&
      this.ticks >= this.header.timeSignatures[0].ticks
    ) {
      this.timeSignature = this.header.timeSignatures.shift().timeSignature;
      this.andTwoThreeFour = 0;
    }
  }
  measureInfo() {
    return {
      ticks: this.ticks,
      measure: this.measure,
      bpm: this.bpm,
      endOfMeasure: this.ticks + this.ticksPerBeat / this.beatsPerMeasure,
      nthsBeatOfMeasure: this.andTwoThreeFour,
      timeSignature: this.timeSignature,
    };
  }

  doTick = () => {
    this.ticks = this.ticks + this.ticksPerBeat;
    this.andTwoThreeFour++;

    if (this.andTwoThreeFour % this.beatsPerMeasure == 0) {
      this.andTwoThreeFour = 0;
      this.measure++;
      this.emit("update", "measure", this.measure, this.ticks);
    }
    this.emit("update", "tick", this.andTwoThreeFour, this.ticks);

    this.updateMetaIfNeeded();
  };
  resume = () => {
    this.updateMetaIfNeeded();
    this.timer = setInterval(this.doTick, this.msPerBeat);
  };
  stop = () => {
    this.emit("stop");
    clearTimeout(this.timer);
  };
}

const { tracks, header } = new Midi(
  readFileSync("./samples/Beethoven-Moonlight-Sonata.mid")
);
const ticker = new Ticker(header);
ticker.resume();
console.log(ticker);
let lt = 0,
  lrt = process.uptime();

ticker.on("update", (event, ...info) => {
  console.log(
    [event, info[0], info[1], ticker.ticks - lt, process.uptime() - lrt].join(
      "\t"
    )
  );
  lt = ticker.ticks;
  lrt = process.uptime();
});

