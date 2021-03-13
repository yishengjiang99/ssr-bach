< !DOCTYPE html5 >
	<html>
		<head>
			<link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css" integrity="sha384-JcKb8q3iqJ61gNV9KGb8thSsNjpSL0n8PARn9HuZOnIxN0hoP+VmmDGMN5t9UJ0Z" crossorigin="anonymous">        </head>
			<body class="container row">
				<div class="sidenav">
					<ul class="list-group" style="max-height: 15; overflow-y: scroll">
						${fs.readdirSync('midi/').map((file) => midilink(file))}
					</ul>
					<ul class="list-group" style="max-height: 15vh; overflow-y: scroll">
						${tones.map((p) => presetlink(p))} ${drums.map((p) =>
						presetlink(p)
					)}
					</ul>
				</div>
				<main id="root" class="col-md-6">
					<ul class="list-group" style="max-height: 69vh; overflow-y: scroll">
						${fs.readdirSync('midi/').map((file) => midilink(file))}
					</ul>
				</main>
				<div class="col-mid-2" id="report">
					<a class="pcm" href="https://grep32bit.blob.core.windows.net/pcm/12v16.pcm">12v16</a>
					<p></p>
					<p></p>
					<p></p>
					<p></p>
					<iframe name="23"></iframe>
				</div>
				<canvas style='opacity:0;position:absolute;width:100vw;height:100vh;background-color:black;z-index:-1'></canvas>
				<script src="/js/build/playpcm.js">
				</script>

			</body>
      </html>