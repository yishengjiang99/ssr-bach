List="synthbass_2 fx_6_goblins pad_3_polysynth"

curl -S "https://gleitz.github.io/midi-js-soundfonts/MusyngKite/$f-mp3.js" -o - |
grep 'data:audio/mp3;base64,' |awk -F 'data:audio/mp3;base64,' '{print $2}'|tr '\"\n,\"' '\n'| grep -v ^$ |base64 --decode \
|ffmpeg -f mp3 -i pipe:0 -ac 1 -ar 48000 -f f32le "$f".pcm
List="one two three"

for a in $List     # Splits the variable in parts at whitespace.
do
  curl -S "https://gleitz.github.io/midi-js-soundfonts/MusyngKite/$f-mp3.js" -o - |
grep 'data:audio/mp3;base64,' |awk -F 'data:audio/mp3;base64,' '{print $2}'|tr '\"\n,\"' '\n'| grep -v ^$ |base64 --decode \
|ffmpeg -f mp3 -i pipe:0 -ac 1 -ar 48000 -f f32le $f.pcm
done