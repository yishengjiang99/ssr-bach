// const wss: WebSocket = new WebSocket("%WSHOST%");
// const wschan = new BroadcastChannel("wschan");

// wss.onopen = () => {
//   //@ts-ignore
//   postMessage({ msg: "ws open" });
//   wss.onmessage = ({ data }) => {
//     wschan.postMessage(data);

//     if (data[0] == "{") {
//       //@ts-ignore
//       postMessage({ playback: JSON.parse(data) });
//     } else {
//       //@ts-ignore
//       postMessage({ msg: "Server: " + data });
//     }
//   };
// };
// onmessage = ({ data }) => {
//   if (data.cmd) {
//     if (wss) wss.send(data.cmd);
//   }
// };

/*
when switching between playbacks, the seek time is carried over..
*/
