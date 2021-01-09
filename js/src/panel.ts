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
  duration: number;
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
    svt.onopen = () => {
      t0 = performance.now();
      requestAnimationFrame(draw);

      // @ts-ignore
      svt.addEventListener("note", ({ start, duration, trackId, midi, instrument }) => {
        this.bars.push({ start, duration, trackId, midi, instrument });
      });
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
      const elapsed = performance.now() - t0;
      this.offset += elapsed;

      if (this.bars.length === 0) return;
      let tn = this.bars[0].start;
      while (true) {
        const { start, duration } = this.bars[this.bars.length - 1];
        if (start + duration > this.offset - this.lookbackWindow) {
          this.bars.shift();
        } else {
          break;
        }
      }
      canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
      for (const bar of this.bars) {
        canvasCtx.fillStyle = `rbga(${pallet[bar.trackId]},1)`;
        canvasCtx.moveTo((HEIGHT / 88) * bar.midi, secondToPixelX(bar.start));
        canvasCtx.fillRect(0, 0, HEIGHT / 88, secondToPixelX(bar.duration));
      }
      canvasCtx.save();
      canvasCtx.restore();
      requestAnimationFrame(draw);
    };
  }
}
