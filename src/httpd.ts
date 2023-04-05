import { listContainerFiles, wsclient } from 'grepupload';
import * as connect from 'connect';

const app = require('connect')();

const sf2container = wsclient().getContainerClient('sf2');

app.use('/b/:blobname', (req, res) => {
  res.write('HTTP/1.1 302 Found \r\n');
  return res.end(
    'Location: ' +
      sf2container.getBlobClient(req.params.blobname).url +
      ' \r\n\r\n'
  );
});
app.use('/', (req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.write('[');

  listContainerFiles('midi')
    .then((blobs) => {
      for (const b of blobs) {
        res.write(JSON.stringify(b));
        res.write(',');
      }
      res.write("'done!']");
      res.end();
    })
    .catch((e) => {
      res.end('[]');
    });
});
app.listen(3000);
