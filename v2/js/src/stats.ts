export const onStats = ({ downloaded, buffered, lossPercent }) => {
  buffM.value = downloaded;
  playedM.value = downloaded - buffered;

  loss.value = lossPercent;
  inmem.value = buffered;

  spans[0].innerHTML = "" + buffM.value;

  spans[1].innerHTML = "" + playedM.value;
  spans[2].innerHTML = "" + inmem.value;
  spans[3].innerHTML = "" + loss.value;
};

export const updateMeterMaxrange = ({ seconds }) => {
  if (seconds) {
    buffM.setAttribute("max", `` + ((seconds * 48000 * 2 * 4) / 1024).toFixed(2));
    playedM.setAttribute("max", `` + ((seconds * 48000 * 2 * 4) / 1024).toFixed(2));
  }
};
const {
  buffM,
  playedM,
  loss,
  inmem,
  spans,
}: {
  buffM: HTMLProgressElement;
  playedM: HTMLProgressElement;
  loss: HTMLProgressElement;
  inmem: HTMLProgressElement;
  spans: NodeListOf<Element>;
} = bindUI();
function bindUI() {
  const buffM: HTMLProgressElement = document.querySelector<HTMLProgressElement>(
    "progress#buffered"
  );
  buffM.value = 0;
  const playedM: HTMLProgressElement = document.querySelector<HTMLProgressElement>(
    "progress#played"
  );
  playedM.value = 0;
  const loss: HTMLProgressElement = document.querySelector<HTMLProgressElement>(
    "progress#loss"
  );
  const inmem: HTMLProgressElement = document.querySelector<HTMLProgressElement>(
    "progress#inmemory"
  );
  const spans = document.querySelectorAll("#stats span");
  return { buffM, playedM, loss, inmem, spans };
}
