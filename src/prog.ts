import { ch } from './app';

const prog = document.querySelector('#prog progress');
ch.port1.onmessage = (e) => {
  const {
    data: {
      prog: [n, d],
    },
  } = e;

  if (n && d) {
    prog.max = d;
    prog.value = n;
  }
};
