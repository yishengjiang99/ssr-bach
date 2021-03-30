import { readFileSync } from "fs";

export const httpsTLS = {
  key: readFileSync("/etc/letsencrypt/live/dsp.grepawk.com/privkey.pem"),
  cert: readFileSync("/etc/letsencrypt/live/dsp.grepawk.com/fullchain.pem"),
};
