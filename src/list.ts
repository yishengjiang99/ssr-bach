import { Writable } from "stream";
import { readdirSync } from "fs";
export const notelist = (res: Writable) => {
  const sections = readdirSync("./midisf");

  for (const section of sections) {
    const links = readdirSync("midisf/" + section).filter((n) =>
      n.endsWith(".pcm")
    );
    res.write("<div class='mt-25'></div>");
    res.write(`<div><span>${section}</span>
    ${links.map((n) => {
      const nn = n.replace("48000-mono-f32le-", "").replace(".pcm", "");
      return `<a href="/bach/notes/${section}/${nn}"> ${nn} </a>`;
    })}
    </div>`);
  }
  res.write(`
     <style>
     .mt-25{
       margin-top:25px;
     }
     body{
       background-color:black;
       color:white;
       
     }
     a{
       color:white;
     }
     canvas{
       top:0;left:0;
       z-index:-2;
    position:absolute;
    width:100vw;
    height:100vh;
  }</style>
  <script type='module' src='/bach/js/playsample.js'></script>`);
};
