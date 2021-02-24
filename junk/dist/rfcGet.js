"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rfcGet = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const rfcGet = (req, res, session) => {
    //GET https://grepawk.com/rfc/midwok/clarinet
    req.writeHead(200, { "Content-Type": "text/html" });
    const jscript = session.parts().length && path_1.resolve(session.parts.join());
    const exec = jscript && fs_1.readFileSync(jscript);
    req.end(/* html */ ` 
<!DOCTYPE html>
<html>
	<body>
<form>
<textarea name='scripts'>
		${exec}
	</textarea>
	<input type='submit'/>
	</form>
	<script type='module'>

	const worker=new Worker(URL.createObjectURL(new Blob([jscript],{type:"application/javascript"})));
	worker.postMessage();
	</script>
	</body>
	</html>`);
};
exports.rfcGet = rfcGet;
