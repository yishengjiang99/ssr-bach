import { release } from "os";
import { envAmplitue } from "./envAmplitue";

export const s16tof32 = (i16: number) => (i16 > 0 ? i16 / 0x7fff : -1 - i16 / 0x8000);
const g = envAmplitue([-4000, -4000, -11000, -4000, -12000], 333, 48000);
let c = 0;
while (c++ < 10110) {
  let n = g.next();
  if (n.done) break;
  process.stdout.write(n.value + "\n");
}
