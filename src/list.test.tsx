import { FileList } from "./list";
import { renderToStaticMarkup } from "react-dom/server";
export const list = require("./list.tsx");
console.log(ReactDOM.renderToStaticMarkup(list));

describe("list.tsx", () => {
  test("1", () => {
    console.log(renderToStaticMarkup(list));
  });
});
