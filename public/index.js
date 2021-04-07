let sff;
function showerror(e) {
  document.write(e.message);
}
const [sfselect, midselect] = document.querySelectorAll('select');
function fetchxml(url)
fetchxml(
  'https://grep32bit.blob.core.windows.net/sf2?resttype=container&comp=list',
  { headers: { accept: 'application/json' } }
)
  .then((res) => res.json())
  .then(({ sffiles, midis, pdta }) => {
    sffiles.map((sff) => {
      const option = document.createElement('option');
      option.innerText = sff.name;
      option.value =
        'https://grep32bit.blob.core.windows.net/sf2/' + encodeURI(sff.name);
      sfselect.appendChild(option);
    });
    midis.map((mi) => {
      const option = document.createElement('option');
      option.innerText = mi.name;
      option.value =
        'https://grep32bit.blob.core.windows.net/midi/' + encodeURI(mi.name);
      midselect.appendChild(option);
    });
  });
sfselect.onchange = (e) => loadsf(e.target.value);
function loadsf(url) {
  fetch(url)
    .then((res) => res.arrayBuffer())
    .then((ab) => {
      let offset = 0;
    })
    .catch((e) => showerror(e));
}
ack;
