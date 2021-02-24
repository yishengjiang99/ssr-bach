export type NoteEvent = Partial<{
  start: number;
  trackId: number;
  end: number;
  velocity: number;
  ticks: number;
  durationTicks: number;
  durationTime: number;
  instrument: {
    percussion: boolean;
    number: number;
  };
  midi: number;
  name: string;
}>;
