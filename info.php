<?php
    $g_stdout=fopen("php://stdout", "w");;
    function dbrows($sql, $outp=0)
    {
        global $g_stdout;
        $buf='';
        $format = ['--html','--raw -B','--csv'][$outp];
        $procd=popen("mysql -u root grepsf2 $format -e '$sql';", "r");
        while ($c=fgets($procd)) {
            echo $c;
            $buf.=$c;
        }
        pclose($procd);
        return $buf;
    }

    dbrows("select now();");
  $s= dbrows("show tables;", 1);
  echo $s;
  $arr=str_split("\t", $s);
  echo $arr[3];
    print_r(explode("\t", dbrows("show tables;", 1)));
    foreach (explode(" ", dbrows("show tables;", 1)) as $k=>$tn) {
        echo $tn+"\n";
    }

    dbrows("select * from shdr limit 41;");