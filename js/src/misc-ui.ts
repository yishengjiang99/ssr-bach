export const cdiv = (
  tag: string,
  attributes: { [k: string]: string } = {},
  children: HTMLElement[] = []
) => {
  const div = document.createElement(tag);
  Object.keys(attributes).map((k) => {
    div[k] = attributes[k];
  });
  children.map((c) => div.append(c));
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

  const std =
    parentDiv.querySelector("#stdout") || cdiv("pre", { id: "stdout" });
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
    printrx,
    printlink: (href, name) => {
      linkdiv.innerHTML += `<a href='${href}'>${name}</a>`;
    },
  }; //
};
