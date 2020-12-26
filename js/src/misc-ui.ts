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

  const rx1 = cdiv("pre", { id: "rx1" });
  function stdout(str: string) {
    rx1.innerHTML = str + "\n" + rx1.innerHTML;
  }
  parentDiv.append(rx1);
  return {
    stdout,
    rx1,
  }; //
};
