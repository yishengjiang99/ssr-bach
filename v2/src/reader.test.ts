import { reader } from "./reader";
import test from "ava";

test("reader", (t) => {
  t.pass();
  const { get32, fstat, read32String } = reader("./file.sf2");
  t.is(read32String(), "RIFF");

  t.is(get32(), fstat().size - 8);

  t.is(read32String(), "sfbk");
  t.is(read32String(), "LIST");
});
