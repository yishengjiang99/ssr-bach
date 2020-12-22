var g_av_timers = [];

export const AnalyzerView = function (
  analyser: AnalyserNode,
  params?: {
    width: number;
    height: number;
  }
) {
  const { width, height } = {
    ...(params || {}),
    ...{
      width: 1024,
      height: 720,
    },
  };

  const av = analyser;
  const HEIGHT = height;
  const WIDTH = width;
  var canvas: HTMLCanvasElement = document.createElement("canvas")!; //(elemId);
  const canvasCtx: CanvasRenderingContext2D = canvas.getContext("2d")!;
  canvas.setAttribute("width", width + "");
  canvas.setAttribute("height", height + "");
  canvasCtx.fillStyle = "rbga(0,2,2,0.1)";
  canvasCtx.lineWidth = 1;
  canvasCtx.strokeStyle = "white";
  var dataArray = new Float32Array(av.fftSize);
  var convertY = (y: number): number => (y * height) / 2 + height / 2;

  canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

  canvasCtx.beginPath();
  canvasCtx.moveTo(0, convertY(0));
  var t = 0;
  canvasCtx.lineWidth = 1;
  var x = 0;
  var zoomScale = 1;
  canvas.onwheel = function (e) {
    e.preventDefault();
    if (e.deltaY < 0) zoomScale -= 0.05;
    else zoomScale += 0.05;
  };
  function draw() {
    av.getFloatTimeDomainData(dataArray);
    var bufferLength = dataArray.length;

    canvasCtx.beginPath();
    var sum = 0;
    canvasCtx.moveTo(0, height / 2);

    sum = dataArray.reduce(
      (accumulator, currentValue) => accumulator + currentValue
    );
    canvasCtx.clearRect(0, 0, width, height);
    canvasCtx.fillRect(0, 0, width, height);
    canvasCtx.strokeStyle = "white";
    canvasCtx.lineWidth = 1;
    let x = 0,
      iwidth = width / bufferLength;
    canvasCtx.strokeText(`r m s : ${sum / bufferLength}`, 10, 20, 100);
    for (let i = 0; i < bufferLength; i++) {
      canvasCtx.lineTo(x, convertY(dataArray[i]));
      x += iwidth;
    }
    canvasCtx.stroke();
    requestAnimationFrame(draw);
  }

  return {
    canvas: canvas,
    start: draw,
  };
};
