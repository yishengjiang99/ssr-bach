describe("ws", () => {
  it("radio", () => {
    const ws = new WebSocket("ws://localhost:3333/song.mid");
    ws.onopen = () => {
      chai.assert("here");
      ws.send("hello");
    };
    ws.onmessage = (data) => {
      console.log(data);
    };
  });
});
