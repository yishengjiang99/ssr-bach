import { resolve } from "path";

export const rfcGet = (req, res, session) => {
  //GET https://grepawk.com/rfc/midwok?clarinet

  res.writeHead(200, { "Content-Type": "text/html" });
  res.rend(req.url);
  res.send("dd");
};

//   const meparts = req.url && req.url.split("?");
//   const parts = meparts[0].split("/");
//   const query = (meparts[1] || "").split("&").reduce((queries, p) => {
//     const [k, v] = p.split("=");
//     queries[k] = decodeURIComponent(v).split("; ")[0];
//     return queries;
//   }, new Map<string, string>());

//   const jscript = session.parts.length && resolve(session.parts.join("/"));
//   const exec = jscript && require("fs").readFileSync(jscript);
//   const args = JSON.stringify(req.query);
//   res.end(/* html */ `
// <!DOCTYPE html>
// <html>
// <style>${require("fs").readFileSync("style.css").toString()}</style>
// 	<body>
// 	${session.who}:

    <form>
      <textarea rows=34 cols=83 name='scripts'>
        ${exec}
      </textarea>
      <input type='submit'/>
    </form>
    <pre></pre>
	  <script type='module'>
    const worker=new Worker(URL.createObjectURL(new Blob([jscript],{type:"application/javascript"})));
    worker.postMessage(args);
    worker.onmessage=({data})=>{
      document.querySelector("pre").innerHTML+=data.toString()+"\n"//(data)
<head>

console.log(data;)
</head>
	</script>
	</body>
	</html>`);
};
