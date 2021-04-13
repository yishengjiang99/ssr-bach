<?php
$r=$_REQUEST;
$presets=isset($r['presets']) ? $r['presets'].split(',') : [];
$sffile =isset($r['sffile']) ? $r['sffile'] : "file.sf2";

$proc=popen("./parsesf $sffile","r");
while($line = fgets($proc)){
	foreach($presets as $p){
		if(strpos($line, )
	}
}