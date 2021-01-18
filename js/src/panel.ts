import { pallet } from "./pallet";

const wschan = new BroadcastChannel("wschan");
wschan.onmessage = (e) => {};

export type NoteEvent = {
  midi: number;
  instrument: string;
  start: number;
  durationTime: number;
  trackId: number;
};
export class EventsPanel {
  ended: boolean;
  evt: any;

  canvas: HTMLCanvasElement;
  constructor(
    private offset: number = 0,
    private bars: NoteEvent[] = [],
    private lookbackWindow = 15
  ) {
    const canvas = document.createElement("canvas");
    document.body.append(canvas);
    window.onresize = () => this.styleCanvas(canvas);
    this.styleCanvas(canvas);
    this.canvas = canvas;
  }
  private styleCanvas(canvas: HTMLCanvasElement) {
    const WIDTH = window.innerWidth; //.clientHeight;
    const HEIGHT = window.innerHeight;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    canvas.style.position = "fixed";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.zIndex = "-3";
    canvas.setAttribute("width", WIDTH + "");
    canvas.setAttribute("height", HEIGHT + "");
  }

  stop() {
    this.evt.close();
  }
  start(rtlink: string) {
    const canvasCtx: CanvasRenderingContext2D = this.canvas.getContext("2d")!;
    const { WIDTH, HEIGHT } = this.prepareDraw(canvasCtx);

    let t0;
    this.evt = wschan;
    let now = 0;
    fetch(rtlink)
      .then((res) => res.text())
      .then((t) =>
        t.split("\n").map((lines) => {
          const [
            start,
            midi,
            ,
            durationTicks,
            _von,
            _voff,
            instrument,
            trackId,
          ] = lines.split(",");
        })
      );

    const draw = () => {
      //   debugger;
      const now = performance.now() / 1000;
      const elapsed = now - t0;
      this.offset += elapsed;
      t0 = now;

      while (true && this.bars.length) {
        const { start, durationTime } = this.bars[this.bars.length - 1];
        if (start + durationTime > this.offset - this.lookbackWindow) {
          this.bars.shift();
        } else {
          break;
        }
      }

      canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
      for (const bar of this.bars) {
        canvasCtx.fillStyle = `red`;
        canvasCtx.fillRect(
          (WIDTH / 88) * bar.midi,
          ((now - bar.start) / this.lookbackWindow) * HEIGHT,
          WIDTH / 88,
          (HEIGHT * bar.durationTime) / this.lookbackWindow
        );
      }
      canvasCtx.save();
      canvasCtx.restore();
      requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);
  }

  private prepareDraw(canvasCtx: CanvasRenderingContext2D) {
    const WIDTH = window.innerWidth; //.clientHeight;
    const HEIGHT = window.innerHeight;
    canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
    canvasCtx.fillStyle = `rbga(${pallet[0]},1)`;
    canvasCtx.lineWidth = 1;
    canvasCtx.strokeStyle = "white";
    return { WIDTH, HEIGHT };
  }
}
