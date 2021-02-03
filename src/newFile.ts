import { init, resolveBuffer } from "./resolvebuffer";

init().then((d) => {
  process.stdout.write(
    resolveBuffer({
      instrument: {
        percussion: false,
        number: 0,
      },
      midi: 33,
      durationTime: 0.444,
    })
  );
  process.stdout.write(
    resolveBuffer({
      instrument: {
        percussion: false,
        number: 0,
      },
      midi: 23,
      durationTime: 0.444,
    })
  );
  process.stdout.write(
    resolveBuffer({
      instrument: {
        percussion: false,
        number: 0,
      },
      midi: 35,
      durationTime: 0.444,
    })
  );
});
