<?php 
$r=array_merge($_GET,$_COOKIE,$POST);
$rtf =file_get_contents("dist/runtime.js");
$proc=file_get_contents("dist/rend_proc.js");
$one=fopen("php://output","w");
if($_GET['resolve']){
   header("Content-Type: application/javascript",200);
   $ff=popen("cat "+$_GET['resolve']+" |grep -v import", "r");
   while(!feof($ff)){
       echo fgetc($ff);
   };
   exit;
}
?>
<!DOCTYPE html>
<html>
  <head>
  </head>
  <body>

    <main style='display:grid; place-content:center'>
              <span id="prog">
                <label></label>
                <progress value="0" max="0"></progress>
              </span>
                <div id='rxs'>
                  <span class="rx"></span>
                  <span class="rx"></span>
                  <span class="rx"></span>
                  <span class="rx"></span>
             
                </div>

                <pre style="max-height: 200px; overflow-y: scroll"></pre>
                <div id="cp">   

                </div>
      <div class="pdtaview"></div>
      <div class="midiview"></div>
    </main>
  <footer> </footer>
  <script
      schema="https://github.com/guest271314/AudioWorkletStream/blob/shared-memory-audio-worklet-stream/index.html"
      type="template/javascript"
      id="workletcode"
    >
    <?php echo $rtf; echo "\n"; echo $prof; ?>
</script>
<script type="module" src='./main.js'>
    </script>
  </body>
</html>
