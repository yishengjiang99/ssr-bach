import { handler, wshand } from "./httpd";
import { run } from "./httpd";
import { get } from "https";
import { ClientRequest } from "http";

let { activeSessions, server } = run(8322);

test("connnectivity", (done): void => {
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

  const request: ClientRequest = get(
    "http://localhost:8332/pcm/song.mid?cookie=tester",
    (res) => {
      expect(res.statusCode).toBe(200);
      let chunks = "";
      res.on("data", (d) => {
        expect(d.byteLength).toBe(1024);
        request.destroy();
        done();
      });
      expect(activeSessions.values()).toHaveLength(2);
    }
  );
});

afterAll(() => {
  server.close();
});
