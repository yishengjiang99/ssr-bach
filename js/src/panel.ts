const pallet = [
  "222, 201, 233",
  "218, 195, 232",
  "210, 183, 229",
  "193, 158, 224",
  "177, 133, 219",
  "160, 108, 213",
  "145, 99, 203",
  "129, 90, 192",
  "114, 81, 181",
  "98, 71, 170",
];
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
    private lookbackWindow = 30
  ) {
    var canvas = document.createElement("canvas");

    document.body.append(canvas);
    function resizeCanvas() {
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      canvas.style.position = "fixed";
      canvas.style.top = "0";
      canvas.style.left = "0";
      canvas.style.zIndex = "-3";
      const WIDTH = window.innerWidth; //.clientHeight;
      const HEIGHT = window.innerHeight;
      canvas.setAttribute("width", WIDTH + "");
      canvas.setAttribute("height", HEIGHT + "");
    }

    // Webkit/Blink will fire this on load, but Gecko doesn't.
    window.onresize = resizeCanvas;
    resizeCanvas();
    this.canvas = canvas;
  }
  stop() {
    this.evt.close();
  }
  start(rtlink: string) {
    const canvasCtx: CanvasRenderingContext2D = this.canvas.getContext("2d")!;
    const WIDTH = window.innerWidth; //.clientHeight;
    const HEIGHT = window.innerHeight;
    canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
    canvasCtx.fillStyle = `rbga(${pallet[0]},1)`;
    canvasCtx.lineWidth = 1;
    canvasCtx.strokeStyle = "white";

    const svt: EventSource = new EventSource(rtlink);
    let t0;
    this.evt = svt;
    let now = 0;
    svt.onopen = () => {
      // @ts-ignore
      svt.addEventListener("note", (e) => {
        this.bars.push(JSON.parse(e.data));
        now = e.data.start;
      });
      requestAnimationFrame(draw);
    };
    svt.addEventListener(
      "closed",
      () => {
        this.ended = true;
      },
      { once: true }
    );

    const secondToPixelX = (t) => {
      return WIDTH / 2 - ((t - this.offset) * WIDTH) / this.lookbackWindow;
    };

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
          (WIDTH * bar.durationTime) / this.lookbackWindow
        );
      }
      canvasCtx.save();
      canvasCtx.restore();
      requestAnimationFrame(draw);
    };
  }
}
