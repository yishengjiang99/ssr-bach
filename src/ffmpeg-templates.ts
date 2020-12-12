type GlobalClause = string;
type DemuxClause = string;
type FilterChainClause = string;
type TXTFileContent = string;

export const qclause: GlobalClause = "-y -hide_banner -loglevel panic";
export const stdformat: string = "-ac 1 -ar 48000 -f f32le";
export const outputFFPlay = (format = "f32le") =>
  `-f ${format} - |ffplay -i pipe:0 -f ${format}`;
export const outputFile = (outputFileName) => `-f f32le ${outputFileName}`;
export const filter = `-filter_complex`;
export const acopy: DemuxClause = "-acodec copy";
export const afadeout: FilterChainClause = `[0:a]afade=type=in:duration=1,afade=type=out:duration=1:start_time=9[a]`;

export const fflists = [`ffmpeg --list-demuxers`];

export const demuxer_template = (demuxer, input) =>
  `ffmpeg -f ${demuxer} -i ${input}`;

export const concat = `-af concat -i playlist.txt`;
export const concatPlaylist: TXTFileContent = `\
ffconcat version 1.0
file file-1.wav
duration 20.0
inpoint 11.2
output 1.2

file subdir/file-2.wav
file file3`;
export const recordmic = "ffmpeg -f avfoundation -i :1 -f mpegts output.ts";

export function build51(...inputs) {
  const [fl, fr, fc, sl, sr, lfe] = inputs;
  `ffmpeg -i fl -i fr -i fc -i sl -i sr -i lfe -filter_complex
'join=inputs=6:channel_layout=5.1:map=0.0-FL|1.0-FR|2.0-FC|3.0-SL|4.0-SR|5.0-LFE'
out`;
}
