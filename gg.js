import {useState, useEffect}from'react';
function Button() {
	const [msg, setMsg] = useState("welcome");
	const [queue, setQueue]=useState(['song.mid']);
	const [played, setPlayed]=useState([]);

	async function init(){
		try {
			let ctx=await ctx.audioWorklet.addModule("./js/build/proc2.js");
			let proc = new AudioWorkletNode(ctx, "playback-processor", {
			  outputChannelCount: [2],
			});
			await new Promise<void>((resolve) => {
			  proc.port.onmessage = ({ data }) => {
				resolve();
			  };
			});
			worker.postMessage({ port: proc.port }, [proc.port]);
			proc.connect(ctx.destination);
			setrState({
				state:'ready',
				ctx,proc
			});
		  } catch (e) {
			  setError(e);
		  }
		}
	function onclick(){
		  if(rstate.state==='init') init();
		  else  if(rstate.state==='ready') worker.postMessage({url: queue.shift()});
		  else if(rsstate.state==='playing') worker.postMessage({cmd:'pause'}); //pause();
		  else {
			console.log(rstate.state)
		  }
		}
	const [wsworker, setWswoker] = useState(
	  new Worker("js/build/ws-worker.js", {
		type: "module",
	  })
	);
	const [rstate, setrState] = useState({
	  state: "init",
	  ctx: null,
	  worker: null,
	});
}


// }



// 	useEffect(() => {
// 	  if (wsworker) {
// 		setMsg("workerinit");
// 	  }
// 	}, [wsworker]);
// 	return <div><span>{msg}</span><button>{rstate.action}<button>{rstate.state}</div>
//   }

//   ReactDOM.render(<PlayBtn />, document.getElementById("root"));