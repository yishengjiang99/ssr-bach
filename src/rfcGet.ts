import { readFileSync } from "fs";
import { resolve } from "path";

export const rfcGet = (req, res, session) => {
  //GET https://grepawk.com/rfc/midwok/clarinet
  req.writeHead(200, { "Content-Type": "text/html" });

  const jscript = session.parts().length && resolve(session.parts.join());
  const exec = jscript && readFileSync(jscript);
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
