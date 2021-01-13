export const cdiv = (
  tag: string,
  attributes: { [k: string]: string } = {},
  children: string | HTMLElement | HTMLElement[] = []
) => {
  const div = document.createElement(tag);
  Object.keys(attributes).map((k) => {
    div[k] = attributes[k];
  });
  typeof children === "string"
    ? (div.innerHTML += children)
    : [].concat(children).map((c) => div.append(c));

  return div;
};

export const startBtn = (clickStart) => {
  const strtbtn = document.createElement("button");
  strtbtn.innerHTML = "start";
  document.body.append(strtbtn);
  strtbtn.onclick = clickStart;
  return strtbtn;
};
export const $ = document.querySelector;

export const stdoutPanel = (parentDiv) => {
  parentDiv = parentDiv || document.body;

  const std = parentDiv.querySelector("#stdout") || cdiv("pre", { id: "stdout" });
  const linkdiv = cdiv("span");
  function stdout(str: string) {
    std.innerHTML = str + "\n" + std.innerHTML;
  }
  const rx1 = parentDiv.querySelector("#rx1") || cdiv("span", { id: "rx1" });
  function printrx(str: string) {
    rx1.innerHTML = str;
  }
  parentDiv.append(rx1);
  parentDiv.append(std);
  return {
    stdout,
    std,
    printrx: (str, n = 1) => {
      parentDiv.querySelector("#rx" + n)
        ? (parentDiv.querySelector("#rx" + n).innerHTML = str)
        : cdiv("span", { id: `rx${n}` }, str);
    },
    printlink: (href, name) => {
      linkdiv.innerHTML += `<a href='${href}'>${name}</a>`;
    },
  }; //
};
