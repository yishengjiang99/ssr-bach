function fetchXML(url, target) {
  const xhr = new XMLHttpRequest();
  xhr.onload = function () {
    xhr.responseXML &&
      xhr.responseXML.documentElement
        .querySelectorAll('Url')
        .forEach((elem) => target.appendChild(elem));
  };
  xhr.open('GET', url);
  xhr.responseType = 'document';
  xhr.send();
}
fetchXML(
  'https://grep32bit.blob.core.windows.net/midi?resttype=container&comp=list',
  null
);
