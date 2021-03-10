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
const { buffM, playedM, loss, inmem, spans, } = bindUI();
function bindUI() {
    const buffM = document.querySelector("progress#buffered");
    buffM.value = 0;
    const playedM = document.querySelector("progress#played");
    playedM.value = 0;
    const loss = document.querySelector("progress#loss");
    const inmem = document.querySelector("progress#inmemory");
    const spans = document.querySelectorAll("#stats span");
    return { buffM, playedM, loss, inmem, spans };
}
