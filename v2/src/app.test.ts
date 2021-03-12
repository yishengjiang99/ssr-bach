import test, { afterEach } from 'ava';
import { get } from 'http';
import { httpd } from './app';
test('httpd server', (t) => {
  t.pass();
  let server;
  afterEach(() => server.close());
  server = httpd(33421);
  server.on('listening', () => {
    t.truthy(server);
    let chunk = [];
    const req = get('http://localhost:3333/55');
    req.on('data', (d) => {
      d.push(chunk);
    });
    req.on('done', () => {
      t.is(Buffer.concat(chunk).toString(), '55');
    });
  });
});
