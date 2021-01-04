import { readFileSync, existsSync } from "fs";
export const httpsTLS = {
  key: readFileSync("/etc/letsencrypt/live/www.grepawk.com-0001/privkey.pem"),
  cert: readFileSync(
    `/etc/letsencrypt/live/www.grepawk.com-0001/fullchain.pem`
  ),
};
