import { SessionContext } from "./httpd";
import {} from "./utils";
import { readFileSync } from "fs";

export const handleRFC = async (req, res, session: SessionContext) => {
  const workerfile =
    req.url.split("/").slice(1).join("/") || req.body || "js/src/midwok.ts";

  const jscript = readFileSync(workerfile);
  res.end(/* html */ `
<!DOCTYPE html>
<html>
<body>
<script>
const worker=new Worker(URL.createObjectURL(new Blob([jscript],{type:"application/javascript"})));
worker.postMessage();
</script>`);
};
