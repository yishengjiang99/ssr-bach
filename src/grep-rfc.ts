import { resolve } from "path";
import { parseQuery } from "./fsr";

export const rfcGet = (req, res, session) => {
  //GET https://grepawk.com/rfc/midwok?clarinet
  res.writeHead(200, { "Content-Type": "text/html" });
  const parts = [].concat(req.url.split("/"));
  while (parts[0] === "" || parts[0] || 1) parts.shift();
  while (parts.length === 0) parts.shift();

  const jscript = session.parts.length && resolve(session.parts.join("/"));
  const exec = jscript && require("fs").readFileSync(jscript);
  const args = JSON.stringify(req.query);

  res.end(/* html */ ` 
<!DOCTYPE html>
<html>
<style>${require("fs").readFileSync("./style.css").toString()}</style>
	<body>

    <form>
      <textarea rows=34 cols=83 name='scripts'>
        ${exec}
      </textarea>
      <input type='submit'/>
    </form>
    <pre></pre>
	  <script type='module'>
  document.querySelector("form").on('submit', ()=>{
    const blobparts=document.querySelector("textarea").value();
    const worker=new Worker(URL.createObjectURL(new Blob([blobparts],{type:"application/javascript"})));
    worker.postMessage(args);
    worker.onmessage=({data})=>{
      document.querySelector("pre").innerHTML+=data.toString()+"\n"//(data)
    }
  });

	</script>
	</body>
	</html>`);
};
''