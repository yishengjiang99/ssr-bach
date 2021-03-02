import { PassThrough } from "stream";
import { loadMidi } from "./load-midi";
import { SF2File } from "./sffile";
import { createServer } from "http";
const wrtc = require("wrtc");
//@ts-ignore
const { RTCPeerConnection, RTCSessionDescription } = wrtc;
const { RTCAudioSink, RTCAudioSource } = wrtc.nonstandard;
// const iceServers = require("./lib/iceServers");
const connections = [];

createServer(async (req, res) => {
  if (req.method === "POST") return handlePOST(req, res);

  try {
    const pc = new RTCPeerConnection({
      //@ts-ignore
      sdpSemantics: "unified-plan",
      //   RTCIceServers: iceServers,
    });
    connections.push(pc);
    //@ts-ignore (pre-emptively)
    pc.id = connections.length;

    const gatheredCans = [];
    const iceCanGatherDone = new Promise((resolve) => {
      pc.addEventListener("icecandidate", ({ candidate }) => {
        //@ts-ignore
        if (!candidate) resolve();
        else gatheredCans.push(candidate);
      });
      pc.oniceconnectionstatechange = () => {
        switch (pc.iceConnectionState) {
          case "connected":
          case "completed":
            //@ts-ignore
            resolve();
            break;
          case "disconnected":
          case "failed":
            res.writeHead(500, "ice connection failed or disconnected");
            return;
        }
      };
    });
    const pt = new PassThrough();
    const { tracks, header, loop } = loadMidi(
      "./song.mid",
      new SF2File("file.sf2"),
      pt,
      24000
    );
    const source = new RTCAudioSource();
    const strack = source.createTrack();
    pc.addTrack(strack);
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") {
        const framebuff = ctx();
        pt.on("data", (d) => {
          if (d.byteLength !== 1024) throw "unexpected frame count!";
          framebuff.samples = new Float32Array(d);
          source.onData(framebuff);
        });
        loop();
      } else {
        pt.end(); //this should trigg dealloc midi player
      }
    };
    const dataChannel = pc.createDataChannel("meta");
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await iceCanGatherDone;
    const html = /* html */ ` 
      <html>
        <body>
          <video id="remote" controls></video>
          <script async>
(async function main(){
  const remotePeerConnection = ${JSON.stringify({
    id: pc.id,
    localDescription: pc.localDescription,
    candidates: gatheredCans,
  })};
  const config = ${JSON.stringify({
    sdpSemantics: "unified-plan",
  })};
  const remoteVideo = document.querySelector("#remote");
  const bpc = new RTCPeerConnection(config);
  await bpc.setRemoteDescription(remotePeerConnection.localDescription);
  const localStream = await window.navigator.mediaDevices.getUserMedia({
    audio: true,
  });
  remotePeerConnection.candidates.forEach((candidate) => {
    if (candidate !== null) bpc.addIceCandidate(candidate);
  });
  const remoteStream = new MediaStream(
    bpc.getReceivers().map((receiver) => receiver.track)
  );
  remoteVideo.srcObject = remoteStream;
  const originalAnswer = await bpc.createAnswer();
  await bpc.setLocalDescription(originalAnswer);
  const { gatheredCandidates } = await fetch("http://localhost:3000/${pc.id}", {
    method: "POST",
    body: JSON.stringify({sdp:bpc.localDescription, id:${pc.id}}),
    headers: {
      "Content-Type": "application/json",
    },
  }).then((res) => res.json());
  gatheredCandidates.forEach((candidate) => {
    if (candidate !== null) bpc.addIceCandidate(candidate);
  }); 
})()
          </script>
        </body>
      </html>`;
    res.end(html);
  } catch (error) {
    console.error(error);
    res.writeHead(500);
    res.end();
  }
}).listen(3000, () => console.log("listenigns"));

function ctx() {
  const sampleRate = 48000;
  const numberOfFrames = 128;
  const secondsPerSample = 1 / sampleRate;
  const channelCount = 2;
  const samples = new Float32Array(channelCount * 128);
  const bitsPerSample = 32;
  const data = {
    samples,
    sampleRate,
    bitsPerSample,
    channelCount,
    numberOfFrames,
  };
  return data;
}

function handlePOST(req, res) {
  console.log(req);

  let d = [];
  req.on("data", (c) => d.push(c));
  req.on("end", async () => {
    const json = JSON.parse(Buffer.concat(d).toString());
    const pc = connections[connections.length - 1];
    await pc.setRemoteDescription(json.sdp);
    res.end(JSON.stringify(pc));
  });
}
