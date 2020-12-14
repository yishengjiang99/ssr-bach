import { readAsCSV } from "../src/readMidiCSV";
function mkcsv() {
  require("fs")
    .readdirSync("midi")
    .forEach((file) => {
      if (file.endsWith("mid")) {
        try {
          readAsCSV("midi/" + file, false).pipe(
            require("fs").createWriteStream(
              "csv/" + file.replace(".mid", ".csv")
            )
          );
        } catch (e) {
          require("child_process").execSync("mv midi/" + file + " trash");
        }
      }
    });
}
function dlsf() {
  require("fs")
    .readdirSync("csv")
    .forEach((file) => {
      if (!file) return;
      console.log("node dist/install.js " + "csv/" + file);
    });
}
mkcsv();
