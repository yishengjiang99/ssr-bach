export function fetchXML(url, target) {
  const xhr = new XMLHttpRequest();
  xhr.onload = function () {
    xhr.responseXML &&
      xhr.responseXML.documentElement
        .querySelectorAll("Url")
        .forEach((elem) =>
          target.appendChild(
            new Option(elem.textContent.split("/").pop(), elem.textContent)
          )
        );
  };
  xhr.open("GET", url);
  xhr.responseType = "document";
  xhr.send();
}
export async function fetchAwaitBuffer(url) {
  return await (await fetch(url)).arrayBuffer();
}
export const fetchWithRange = (url, range) => {
  return fetch(url, {
    headers: {
      Range: "bytes=" + range,
    },
  });
};
