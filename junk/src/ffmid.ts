// #!/usr/env/ts-node

// import { basename, extname } from "path";
// import { createWriteStream } from "fs";
// import { readAsCSV } from "./src/read-midi-sse-csv";
// async function run(midfile) {
//   const output = basename(midfile).replace(extname(midfile), ".csv");
//   await new Promise((resolve, reject) => {
//     try
//     {
//       readAsCSV(midfile)
//         .pipe(createWriteStream(output))
//         .on("end", resolve);
//     } catch (e)
//     {
//       reject(e);
//     }
//   });
//   //  installNotesFromCsv(output);
// }

// if (process.argv[2])
// {
//   run(process.argv[2]);
// }

