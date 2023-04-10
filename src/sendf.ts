import { BlobServiceClient } from '@azure/storage-blob';
const grepupload = require('grepupload');
async function tt() {
  let ff = BlobServiceClient.fromConnectionString(
    'DefaultEndpointsProtocol=https;AccountName=grep32bit;AccountKey=ccpWG/SR/fOjinEHEA/nTRAzX0iC8QlgTJAajrKzzA4mRF0K6pJ3RrwU8AJU5HaJ13skPneq1aqt+0j1FNKS7g==;EndpointSuffix=core.windows.net'
  );
  const containerClient = ff.getContainerClient('sf2');
  let i = 1;
  for await (const blob of containerClient.listBlobsFlat()) {
    console.log(`Blob ${i++}: ${blob.name}`);
    if (i == 3) {
      const bbv = await containerClient.getBlobClient(blob.name).download();
      bbv.blobBody;
      break;
    }
  }
}
tt();
