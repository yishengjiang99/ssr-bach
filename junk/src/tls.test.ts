import { httpsTLS } from "./tls";

test("tls", () => {
  expect(httpsTLS.key).toBeInstanceOf(Buffer);
  expect(httpsTLS.cert).toBeInstanceOf(Buffer);
});
