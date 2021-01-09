import { handler, wshand } from "./httpd";
import { run } from "./httpd";
import { request } from "http";
test("connnectivity", (): void => {
  run(8322);
  require("http").request("GET");
});
