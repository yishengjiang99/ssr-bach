const wschan = new BroadcastChannel("wschan");
wschan.onmessage = (e) => {};
export class EventsPanel {
    constructor(offset = 0, bars = [], lookbackWindow = 15) {
        this.offset = offset;
        this.bars = bars;
        this.lookbackWindow = lookbackWindow;
        const canvas = document.createElement("canvas");
        document.body.append(canvas);
        window.onresize = () => this.styleCanvas(canvas);
        this.styleCanvas(canvas);
        this.canvas = canvas;
    }
    styleCanvas(canvas) {
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
    async start(rtlink) {
        const canvasCtx = this.canvas.getContext("2d");
        const { WIDTH, HEIGHT } = this.prepareDraw(canvasCtx);
        let t0;
        this.evt = wschan;
        let now = 0;
        this.bars = await fetch(rtlink)
            .then((res) => res.text())
            .then((t) => t.split("\n").map((lines) => {
                const [start, midi, , durationTicks, _von, _voff, instrument, trackId, ] = lines.split(",");
                return {
                    midi: parseInt(midi),
                    instrument,
                    start: parseInt(start) / 256 * 60,
                    durationTime: parseInt(durationTicks) / 256 * 300,
                    trackId: parseInt(trackId)
                };
            }));
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
                canvasCtx.fillRect((WIDTH / 88) * bar.midi, ((now - bar.start) / this.lookbackWindow) * HEIGHT, WIDTH / 88, (HEIGHT * bar.durationTime) / this.lookbackWindow);
            }
            canvasCtx.save();
            canvasCtx.restore();
            requestAnimationFrame(draw);
        };
        requestAnimationFrame(draw);
    }
    prepareDraw(canvasCtx) {
        const WIDTH = window.innerWidth; //.clientHeight;
        const HEIGHT = window.innerHeight;
        canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
        canvasCtx.fillStyle = `red`;
        canvasCtx.lineWidth = 1;
        canvasCtx.strokeStyle = "white";
        return { WIDTH, HEIGHT };
    }
}