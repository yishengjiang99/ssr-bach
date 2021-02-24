import {load, findIndex,memcopy, resolvebuffer}from'./resolvebuffer';
import { ffp } from './sinks';

test("preload", ()=>{
  const [csv,buffer]=load();
  expect(csv.length).toBeGreaterThan(0);
  expect(csv[0]).toBeTruthy();
  console.log(csv[1]);
})

test("resolve",()=>{
  const bufdex=findIndex(0, 44, 120)
  const buf=Buffer.allocUnsafe(48000*2*4)
  memcopy(bufdex,buf,48000);
  
  for(let n=4000;n>0;n--)   {
    const flsample=buf.readFloatLE(Math.floor(Math.random()*50/4)*4)
    expect(flsample).toBeDefined;
  }
})