// import { SFZone ,SF2File} from '../node_modules/parse-sf2/dist/';
// import { SynthChannel } from './audio-path';
// export async function renderOffline(
//   zone: SFZone,
//   audioBuffer: AudioBuffer
//   sffile:SF2File,
// ): Promise<AudioBuffer> {
//   return new Promise((resolve) => {
//     const sr = zone.sample.sampleRate;
//     const nchannels = zone.sample.sampleType == 4 ? 2 : 1;

//     const ctx = new OfflineAudioContext(nchannels, 1 * sr, sr);
//     const { triggerStart } = new SynthChannel(ctx, zone, audioBuffer);
//     triggerStart();
//     ctx.startRendering();
//     ctx.oncomplete = (e: OfflineAudioCompletionEvent) => {
//       resolve(e.renderedBuffer);
//     };
//   });
// }
