export const s16tof32 = (i16: number) => (i16 > 0 ? i16 / 0x7fff : -1 - i16 / 0x8000);
