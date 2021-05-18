export interface Attr {
  [key: string]: string | EventListener;
}

export function mkdiv(
  type: keyof HTMLElementTagNameMap,
  attr: Attr = {},
  children: string | string[] | HTMLElement | HTMLElement[] = ""
): HTMLElement {
  const div = document.createElement<typeof type>(type);
  for (const key in attr) {
    if (key.match(/on(.*)/)) {
      div.addEventListener(key.match(/on(.*)/)![1], attr[key] as EventListener);
    } else {
      div.setAttribute(key, attr[key] as string);
    }
  }
  const charray = !Array.isArray(children) ? [children] : children;

  charray.forEach((c: string | HTMLElement) => {
    typeof c == "string" ? (div.innerHTML += c) : div.append(c);
  });
  return div;
}
//
