export const ttt = function () {
  const buffM: HTMLProgressElement = document.querySelector<HTMLProgressElement>(
    "progress#buffered"
  );
  buffM.value = 0;
  const playedM: HTMLProgressElement = document.querySelector<HTMLProgressElement>(
    "progress#played"
  );
  playedM.value = 0;
  const loss: HTMLMeterElement = document.querySelector<HTMLMeterElement>(
    "meter#loss"
  );
  const inmem: HTMLMeterElement = document.querySelector<HTMLMeterElement>(
    "meter#inmemory"
  );
  const spans = document.querySelectorAll("#stats span");

  const onStats = (data) => {
    buffM.value = data.stats.downloaded;
    playedM.value = data.stats.downloaded - data.stats.buffered;

    loss.value = data.stats.lossPercent;
    inmem.value = data.stats.buffered;

    spans[0].innerHTML = "" + buffM.value;

    spans[1].innerHTML = "" + playedM.value;
    spans[2].innerHTML = "" + inmem.value;
    spans[3].innerHTML = "" + loss.value;
  };
  const onPlayback = (data) => {
    const { bpm, name, seconds, text } = data.playback;
    if (seconds) {
      buffM.setAttribute(
        "max",
        `` + ((seconds * 48000 * 2 * 4) / 1024).toFixed(2)
      );
      playedM.setAttribute(
        "max",
        `` + ((seconds * 48000 * 2 * 4) / 1024).toFixed(2)
      );
    }

    if (data.playback.meta) {
      debugger;
    }
  };
  return {
    onPlayback,
    onStats,
  };
};
