const h = (type, attr, children) => {
  const div = document.createElement(type);
  for (const key in attr) {
    if (key.match(/on(.*)/)) {
      div.addEventListener(key.match(/on(.*)/)[1], attr[key]);
    } else {
      div.setAttribute(key, attr[key]);
    }
  }
  if (Array.isArray(children)) children.forEach((c) => div.appendChild(c));
  else div.textContent = children;
  return div;
};

async function fetchAwaitBuffer(url) {
  return await (await fetch(url)).arrayBuffer();
}

function selectBox(list, onselect) {
  return h(
    'select',
    { oninput: (e) => onselect(e.target.value) },
    list.map((item) => h('option', { value: item.value }, item.name))
  );
}
