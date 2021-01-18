import { readFileSync } from "fs";

export const httpsTLS = {
  key: readFileSync(process.env.PRIV_KEYFILE),
  cert: readFileSync(process.env.CERT_FILE),
};
