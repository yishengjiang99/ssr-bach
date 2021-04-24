import { SFZone } from '../node_modules/parse-sf2/dist/';
import { renderZone } from './audio-path.js';
export async function renderOffline(
  zone: SFZone,
  audioBuffer: AudioBuffer
): Promise<AudioBuffer> {
  return new Promise((resolve) => {
    const sr = zone.sample.sampleRate;
    const nchannels = zone.sample.sampleType == 4 ? 2 : 1;

    const ctx = new OfflineAudioContext(nchannels, 1 * sr, sr);
    const { triggerStart } = renderZone(ctx, zone, audioBuffer);
    triggerStart();
    ctx.startRendering();
    ctx.oncomplete = (e: OfflineAudioCompletionEvent) => {
      resolve(e.renderedBuffer);
    };
  });
}
