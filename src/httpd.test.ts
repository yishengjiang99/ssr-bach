import { get } from "https";
import { ClientRequest,ServerResponse } from "http";
import { Server } from "./httpd";
process.env.HOST='dsp.greawk.com'
test("connnectivity", (done): void => {
  let port = 8322;
  const url=`https://${process.env.HOST}:${port}`;
  let server = new Server(8322,process.env.HOST);
  server.start();
  server.server.once("listening",()=>{
    ["/","/pcm","/rt","/samples",'midi'].map(path=>{
      testendpoint(url+path,(res)=>{
        expect(res.statusCode).toBe(200)
      })
    })
    testendpoint( "https://localhost:8332", function verify(){
      expect(true)
    });

  })

});

function testendpoint(endpoint:string, verify:(res:ServerResponse)=>void){ ////} activeSessions: Map<string, import("/Users/yisheng/Documents/GitHub/ssr-bach/src/ssr-remote-control.types").SessionContext>) {
  get(endpoint, (res)=> verify);
}
