import { cspawn } from "./cspawn"
import { stdformat } from "./ffmpeg-templates"

export const pcm2png=(buffer)=>{
return	cspawn(`ffmpeg ${stdformat} -i pipe:0 -filter_complex "showwavespic=s=640x120" -frames:v 1 -`).stdout;
}