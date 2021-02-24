
<script src="https://cdn.jsdelivr.net/npm/@tonejs/midi@2.0.26/build/Midi.min.js"></script>
<script>
const midi = new Midi()
</script>

<?php 
$query = str_replace("_mid",".mid",array_keys($_GET)[0]);
exec("node ./dist/load-sort-midi.js $query")
?>


$f=fopen(__DIR__."/".$query,"rb");