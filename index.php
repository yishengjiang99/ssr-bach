<?php
    $g_stdout=fopen("php://stdout", "w");;

$pd=popen("node -r ts-node/register src/loadmidi.ts", "r");
while ($c=fgets($pd)) {
    echo $c;
}
pclose($pd);