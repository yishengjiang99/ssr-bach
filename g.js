import { readMidi } from './node_modules/midiread/dist/index.js';
import { get, set } from 'https://unpkg.com/idb-keyval@5.0.2/dist/esm/index.js';

let fileHandle;
document.body.appendChild(document.createElement('pre'));
document.body.appendChild(document.createElement('pre'));
const [pickf, pickd] = document.querySelectorAll('button');
const div = document.querySelector('pre');
const logs = [];

const loghtml = (...entry) => {
  logs.push(entry.join('\t'));
  div.innerHTML = logs.join('\n');
  if (logs.length > 90) logs.shift();
};

const [pre1, pre2] = document.querySelectorAll('pre');
pickf.onclick = async () => {
  try {
    [fileHandle] = await window.showOpenFilePicker();
    const file = await fileHandle.getFile();
    // const contents = await file.blob();
    const up = await (async function* upload() {
      let uploadoffset = 0;
      while (uploadoffset < file.size) {
        yield fetch('/upload.php', {
          method: 'post',
          body: await file.slice(uploadoffset, uploadoffset + 1024 * 1024),
          headers: { upload_filename: file.name },
        })
          .then((res) => {
            if (res.ok) {
              uploadoffset += 1024 * 1024;
            }
          })
          .catch((e) => alert(e.message));
      }
      return;
    })();

    for await (const _ of up);
  } catch (e) {
    //
    console.log(e);
  }
};
async function getdir() {
  try {
    const directoryHandleOrUndefined = await get('directory');
    if (directoryHandleOrUndefined) {
      pre2.textContent = `Retrieved directroy handle "${directoryHandleOrUndefined.name}" from IndexedDB.`;
      return directoryHandleOrUndefined;
    }
    const directoryHandle = await window.showDirectoryPicker();
    await set('directory', directoryHandle);
    pre2.textContent = `Stored directory handle for "${directoryHandle.name}" in IndexedDB.`;
    return directoryHandle;
  } catch (error) {
    alert(error.name, error.message);
  }
}
async function listfiles(dirhand) {
  for await (const entry of dirhand.values()) {
    //  loghtml(entry.kind, entry.name);
  }
}
pickd.onclick = getdir(); //.then(listfiles);
async function writeURLToFile(fileHandle, url) {
  // Create a FileSystemWritableFileStream to write to.
  const writable = await fileHandle.createWritable();
  // Make an HTTP request for the contents.
  const response = await fetch(url);
  // Stream the response into the file.
  await response.body.pipeTo(writable);
  // pipeTo() closes the destination pipe by default, no need to close it.
}
