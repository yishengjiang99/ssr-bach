import { findSourceMap } from "module";

const sdta = "sdta".split("").map((c) => c.charCodeAt(0));
const pdta = "pdta".split("").map((c) => c.charCodeAt(0));

async function fetchsf2(url: string) {
  const reader = (await fetch(url)).body?.getReader();
  if (!reader) return;
  let offset = 0;
  const { value, done } = await reader.read();
  function findString(){

  }
  while (offset++ < value!.byteLength) {

    if(value as Uint8Array)[offset++] == sdta[i++]){

    }
  
  }
  if (value[offset]) console.log(offset);
}

fetchsf2("file.sf2");
