type WebSocketRefStr = string;
export type SessionContext = {
  t?: any;
  wsRef?: WebSocketRefStr; //used to message user via ws during playback
  rc?: RemoteControl; //this controls active playback + the data channel actively piping to their browser
  ffspawn?: ChildProcess; //the ffmpeg filter
  file?: string; //file being played
  who: string; //randomly assigned username,
  parts: string[]; //currently requested path;
  query: Map<string, string>; // /index.php?a=3&b=3
};
const activeSessions = new Map<string, SessionContext>();
const wsRefs = new Map<WebSocketRefStr, WsSocket>();
