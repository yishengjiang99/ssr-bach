export function initGain(ctx: AudioContext): [GainNode, HTMLInputElement] {
  const gainNode = new GainNode(ctx);
  const slider: HTMLInputElement = document.createElement<"input">("input");
  slider.type = "range";
  slider.min = "0";
  slider.max = "2";
  slider.step = "0.1";
  slider.defaultValue = gainNode.gain + "";
  slider.oninput = () =>
    gainNode.gain.linearRampToValueAtTime(
      parseFloat(slider.value),
      ctx.currentTime + 0.1
    );

  return [gainNode, slider];
}
