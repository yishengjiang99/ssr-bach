const h = (
  type: string,
  attr: { [x: string]: any },
  children: HTMLElement[] | string | Promise<HTMLElement>[] = []
): HTMLElement => {
  const div = document.createElement(type);
  for (const key in attr) {
    if (key.match(/on(.*)/)) {
      div.addEventListener(key.match(/on(.*)/)[1], attr[key]);
    } else if (typeof attr[key] == 'string') {
      div.setAttribute(key, attr[key] as string);
    }
  }
  if (Array.isArray(children))
    children.forEach((c) => {
      if (c.then) {
        c.then((r) => div.appendChild(r));
      } else {
        div.appendChild(c);
      }
    });
  else {
    div.innerHTML += children;
  }

  return div;
};
