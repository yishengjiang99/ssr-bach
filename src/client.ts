import { readFileSync } from "fs";
import { connect, getPackedSettings } from "http2";
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";
const packed = getPackedSettings({ enablePush: false });

console.log(packed.toString("base64"));
const client = connect("https://dsp.grepawk.com:8443", {
  ca: readFileSync(process.env.CERT_FILE),
});

client.on("error", (err) => console.error(err));

const req = client.request({ ":path": "/" });

client.on("stream", (pushedStream, requestHeaders) => {
  pushedStream.on("push", (responseHeaders) => {
    // Process response headers
    console.log(responseHeaders);
  });
  pushedStream.on("data", (chunk) => {
    /* handle pushed data */
    console.log(chunk);
  });
});

req.on("response", (headers, flags) => {
  for (const name in headers) {
    console.log(`${name}: ${headers[name]}`);
  }
  req.write("hi");
});

req.setEncoding("utf8");
let data = "";
req.on("data", (chunk) => {
  data += chunk;
});
req.on("end", () => {
  console.log(`\n${data}`);
  client.close();
});
