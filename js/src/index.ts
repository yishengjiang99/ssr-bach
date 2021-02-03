const mediaTag: HTMLMediaElement = document.createElement<"audio">("audio");
const sb:SourceBuffer=new SourceBuffer();
sb.appendBuffer(ab:);
const mediaSource = new MediaSource();
mediaSource.addSourceBuffer(new SourceBuffer())
mediaTag.srcObject = mediaSource;

document.body.append(mediaTag);
