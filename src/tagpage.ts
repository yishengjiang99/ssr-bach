export const indexHTML = (res, mainJS, style, midifiles) => {
  function tag(str: TemplateStringsArray, ...args: string[]) {
    for (const i in args) {
      res.write(str[i]);
      res.write(args[i]);
    }
    res.write(str[str.length - 1]);
  }
  tag/* html */ `<!DOCTYPE html>
<html>
  <head>
    <style>
	  ${style}
	  a {color:white}
    </style>
  </head>
  <body>
      <div id='root' style='display:grid;grid-template-columns:1fr 1fr'>
    <span>  
    <button id='btn'>
      <svg id="playpause" width="100" height="100" viewBox="0 0 500 500">
      <defs>
        <path
          id="play"
          fill="currentColor"
          d="M424.4 214.7L72.4 6.6C43.8-10.3 0 6.1 0 47.9V464c0 37.5 40.7 60.1 72.4 41.3l352-208c31.4-18.5 31.5-64.1 0-82.6z"
        ></path>
        <path
          fill="currentColor"
          d="M144 479H48c-26.5 0-48-21.5-48-48V79c0-26.5 21.5-48 48-48h96c26.5 0 48 21.5 48 48v352c0 26.5-21.5 48-48 48zm304-48V79c0-26.5-21.5-48-48-48h-96c-26.5 0-48 21.5-48 48v352c0 26.5 21.5 48 48 48h96c26.5 0 48-21.5 48-48z"
          id="pause"
        ></path>
      </defs>
      <use x="5" y="5" href="#play" fill="currentColor" />
    </svg>
    </button></span>
	<script type='module'>
	${mainJS}
	</script>
    <span id='stats' width=50%>
    <div>
		<label for='buffered'>Downloaded (kb): </label>
		<progress value=0 id='buffered' max='100'>
		<span></span>
	</div>

  
    <div> <label for='played'>Played (kb): </label><progress id='played' max='100'><span></span></div>
    <div> <label for='inmemory'>in memory: </label><meter id='inmemory' min='0' max='1000'><span></span></div>
    <div> <label for='loss'>Packet Loss (%): </label><meter id='loss' max='100'><span></span></div>
    </span>
    <div id='rx1'></div>
    <div id='log'></div>
</div>
<pre id='stdout'></pre>

<canvas></canvas>
</div>`;
};
