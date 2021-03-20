import { envAmplitue } from './envAmplitue';
import { SFZone } from './Zone';

export function envelope(
  zone: SFZone,
  {
    noteVelocity,
    noteEnd,
    sampleRate,
  }: {
    noteVelocity: number;
    noteEnd?: number;
    sampleRate: number;
  }
) {
  const {
    phases: { delay, attack, hold, decay, release },
    sustain,
  } = zone.volEnv;
  return envAmplitue(
    [delay, (attack * (144 - noteVelocity)) / 127, hold, decay, release],
    sustain,
    sampleRate,
    noteEnd
  );
}
