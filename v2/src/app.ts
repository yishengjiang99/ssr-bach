import { IncomingMessage, ServerResponse, createServer } from "http";
import { PassThrough } from "stream";
import { SF2File } from "./sffile";
import { loadMidi } from "./load-midi";
import wrtc from "wrtc";
import { IceServers } from "./ice-servers";
const { RTCPeerConnection } = wrtc;
const { RTCAudioSource } = wrtc.nonstandard;
const connections = [];
const sf = new SF2File("file.sf2");
const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  if (req.method === "GET") {
    const pc: RTCPeerConnection = new RTCPeerConnection({
      sdpSemantics: "unified-plan",
      RTCIceServers: IceServers,
    });
    const id = connections.length; // + "";

    connections[id] = pc;

    const iceCanGatherDone: Promise<RTCIceCandidate[]> = gatherchans(pc, res);
    const source = new RTCAudioSource();
    const strack = source.createTrack();
    pc.addTrack(strack);
    const pt = new PassThrough();
    const { loop, tracks } = loadMidi("song.mid", sf, pt, 44100);

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") {
        playmidi(loop, pt, source);
        let start = 0,
          end = 255 * 30 * 4;
        print_notes(res, tracks, start, end);
      }
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    const gatheredCans = await iceCanGatherDone;
    printHTML(res, id, pc, gatheredCans);
  }
  if (req.method === "POST") {
    const json: any = await resolveJSON(req);
    //@ts-ignore
    const pc = connections[json.id];
    await pc.setRemoteDescription(json.sdp);
    return res.end(JSON.stringify(pc));
  }
});

server.listen(3000);

function print_notes(res: ServerResponse, tracks, start: number, end: number) {
  res.write(
    `<script type="JSON">${JSON.stringify(
      tracks.map((t) => t.notes.filter((n) => n.ticks > start && n.ticks <= end))
    )}</script>`
  );
}

async function gatherchans(pc: RTCPeerConnection, res: ServerResponse) {
  const gatheredCans: RTCIceCandidate[] = [];
  return new Promise<RTCIceCandidate[]>((resolve) => {
    pc.addEventListener("icecandidate", ({ candidate }) => {
      if (!candidate) resolve(gatheredCans);
      else gatheredCans.push(candidate);
    });
    pc.oniceconnectionstatechange = () => {
      switch (pc.iceConnectionState) {
        case "connected":
        case "completed":
          resolve(gatheredCans);
          break;
        case "disconnected":
        case "failed":
          res.writeHead(500, "ice connection failed or disconnected");
          return;
      }
    };
  });
}

async function handpost(req: IncomingMessage, res: ServerResponse) {
  const json: any = await resolveJSON(req);
  //@ts-ignore
  const pc = connections[json.id];
  await pc.setRemoteDescription(json.sdp);

  res.end(JSON.stringify(pc));
  return;
}

function printHTML(
  res: ServerResponse,
  id: number,
  pc: RTCPeerConnection,
  gatheredCans: RTCIceCandidate[]
) {
  res.write(/* html */ ` 
  <html>
    <body>
      <video id="local" controls></video>
      <video id="remote" controls></video>
      <script>
async function main(){
  const remotePeerConnection = ${JSON.stringify({
    id: id,
    localDescription: pc.localDescription,
    candidates: gatheredCans,
  })};
  const config = ${JSON.stringify({
    sdpSemantics: "unified-plan",
    RTCIceServers: IceServers,
  })};
  const localVideo = document.querySelector("#local");
  const remoteVideo = document.querySelector("#remote");
  const bpc = new RTCPeerConnection(config);
  await bpc.setRemoteDescription(remotePeerConnection.localDescription);

  remotePeerConnection.candidates.forEach((candidate) => {
    if (candidate !== null) bpc.addIceCandidate(candidate);
  });


  const remoteStream = new MediaStream(
    bpc.getReceivers().map((receiver) => receiver.track)
  );
  remoteVideo.srcObject = remoteStream;

  const originalAnswer = await bpc.createAnswer();
  await bpc.setLocalDescription(originalAnswer);
   const post  = JSON.stringify({sdp:bpc.localDescription, id:'${id}'});
  fetch("http://localhost:3000/${id}", {
    method: "POST",
    body: post,
    headers: {
      "Content-Type": "application/json",
      "Content-Length": post.length
    },
  }).then((res) => res.json()).then(({candidates})=>{
    debugger;

  });
}
main();
    </script>
  </body>
</html>`);
}

function playmidi(loop: () => void, pt: PassThrough, source: any) {
  const { numberOfFrames, channelCount, samples, data } = actx();
  let sampleoffset = 0;
  pt.on("data", (d: Buffer) => {
    let readoffset = 0;
    while (readoffset <= d.byteLength - 4) {
      while (
        sampleoffset < numberOfFrames * channelCount &&
        readoffset <= d.byteLength - 4
      ) {
        samples[sampleoffset] = d.readFloatLE(readoffset) * 0xffff;
        readoffset += 4;
        sampleoffset++;
      }
      source.onData(data);
      sampleoffset = 0;
    }
  });
  loop();
}

function actx() {
  const sampleRate = 44100;
  const numberOfFrames = sampleRate / 100;
  const secondsPerSample = 1 / sampleRate;
  const channelCount = 2;
  const samples = new Int16Array(channelCount * numberOfFrames);
  const bitsPerSample = 16;
  const data = {
    samples,
    sampleRate,
    bitsPerSample,
    channelCount,
    numberOfFrames,
  };
  return { bitsPerSample, numberOfFrames, secondsPerSample, channelCount, samples, data };
}

async function resolveJSON(req: IncomingMessage) {
  return new Promise((resolve) => {
    let str = "";
    req.on("data", (d) => (str += d.toString()));
    req.on("end", () => {
      resolve(JSON.parse(str));
    });
  });
}
