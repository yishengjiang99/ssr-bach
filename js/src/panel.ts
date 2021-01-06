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
  constructor(
    private parentElement: HTMLElement,
    private offset: number = 0,
    private bars: NoteEvent[] = [],
    private lookbackWindow = 30
  ) {}

  start(rtlink: string) {
    const HEIGHT = this.parentElement.clientHeight;
    const WIDTH = this.parentElement.clientWidth;
    var canvas: HTMLCanvasElement = document.createElement("canvas")!; //(elemId);
    const canvasCtx: CanvasRenderingContext2D = canvas.getContext("2d")!;
    canvas.setAttribute("width", WIDTH + "");
    canvas.setAttribute("height", HEIGHT + "");
    canvas.style.zIndex = "-3";

    canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
    canvasCtx.fillStyle = `rbga(${pallet[0]},1)`;
    canvasCtx.lineWidth = 1;
    canvasCtx.strokeStyle = "white";
    this.parentElement.append(canvas);
    const svt: EventSource = new EventSource(rtlink);
    let t0;
    svt.onopen = () => {
      // @ts-ignore
      svt.addEventListener("note", ({ start, duration, trackId, midi, instrument }) => {
        this.bars.push({ start, duration, trackId, midi, instrument });
      });
      t0 = performance.now();
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
