import { readFileSync, existsSync } from "fs";

export const httpsTLS = {
  key: readFileSync(process.env.PRIV_KEYFILE),
  cert: readFileSync(process.env.CERT_FILE),
  SNICallback: function (domain, cb) {
    if (!existsSync(`/etc/letsencrypt/live/${domain}`)) {
      cb();
      return;
    }
    cb(
      null,
      require("tls").createSecureContext({
        key: readFileSync(`/etc/letsencrypt/live/${domain}/privkey.pem`),
        cert: readFileSync(`/etc/letsencrypt/live/${domain}/fullchain.pem`),
      })
    );
  },
};
