import { request } from "https";
describe("httpd the webserver", () => {
  test("/list.json lists files", () => {
    setTimeout(() => {
      return expect(asyncThrowOrNot(true)).rejects.toEqual(
        new Error("shouldThrow was true")
      );
    }, 1000);
  });
});
