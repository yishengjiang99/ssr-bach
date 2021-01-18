import { get } from "https";
import { ClientRequest } from "http";
import { Server } from "./httpd";

test("connnectivity", (done): void => {
  let { activeSessions, server } = new Server(8322);

  get("https://localhost:8332", (res: any) => {
    expect(res.statusCode).toBe(200);
    let chunks = "";
    res.on("data", (d) => (chunks += d.toString()));
    res.on("end", () => {
      expect(chunks).toContain("<html>");
      done();
    });
    expect(res.headers.cookie).toContain("who=");
    expect(activeSessions).toHaveLength(1);
  });
});
test("/rt", (done): void => {
  const server = new Server(9444);
  const request: ClientRequest = get(
    "https://localhost:8332/rt/song.mid?cookie=tester",
    (res) => {
      expect(res.statusCode).toBe(200);
      let chunks = "";
      res.on("data", (d) => {
        expect(d.byteLength).toBe(1024);
        request.destroy();
        done();
      });
      expect(server.activeSessions.entries()).toBe(1);
    }
  );
});

test("/pcm", (done): void => {
  const server = new Server(9444);
  const request: ClientRequest = get(
    "https://localhost:8332/pcm/song.mid?cookie=tester",
    (res) => {
      expect(res.statusCode).toBe(200);
      let chunks = "";
      res.on("data", (d) => {
        expect(d.byteLength).toBe(1024);
        request.destroy();
        done();
      });
      expect(server.activeSessions.entries()).toBeTruthy();
    }
  );
});
