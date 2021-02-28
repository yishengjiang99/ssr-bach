import { spawn } from "child_process";
export type FfpProps = { ar?: number; ac?: number; format?: string };
export const ffp = (props?: FfpProps) => {
  const { ar, ac, format } = props || {};
  const { stdin, stderr, stdout } = spawn("ffplay", [
    "-i",
    "pipe:0",
    "-ac",
    `${ac || "2"} `,
    "-f",
    `${format || "f32le"}`,
    "-ar",
    `${ar || "48k"} `,
  ]);
  stdout.on("error", (e) => {
    // console.log(e);
  });
  stderr.pipe(process.stderr);
  stdout.pipe(process.stderr);
  return stdin;
};
