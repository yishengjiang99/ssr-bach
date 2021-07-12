# mkdiv

for making **divs** and other html tags.

```javascript
import { mkdiv as h } from './index.js?s';

document.body.append(
  h('main', { style: 'width:700px;display:grid;place-items:center' }, [
    h('img', {
      src: sampleImg(),
      onload: () => console.log('load'),
    }),
    h('ul', {}, [h('li', { class: 'listitem' }, 'list 1')]),
    h('button', { onclick: () => alert('clicked') }, 'click'),
  ])
);
```
