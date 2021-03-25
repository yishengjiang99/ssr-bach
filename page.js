const aside = document.body.querySelector('aside');
fetch('cache/').then((res) =>
  res.body
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(
      new TransformStream({
        transform: (input) => {
          return input.replace(
            /<(a) href=(.*)>(.*)<\/(a)>/,
            `<card onclick='fetchJSON' href='$2'>$3</card>`
          );
        },
      })
    )
    .pipeTo(
      new WritableStream({
        write: (chunk) => {
          cardsDiv.innerHTML += chunk;
        },
      })
    )
);
