import { readFileSync, readdirSync, createReadStream } from "fs";
import { transform } from "@babel/core";

export const compile_ts = (tsfile): Promise<string | void> => {
  const code = readFileSync(tsfile).toString();
  return new Promise((resolve, reject) =>
    transform(
      code,
      {
        filename: tsfile,
        presets: ["@babel/preset-typescript"],
      },
      (err, res) => (err ? reject(err) : resolve(res.code))
    )
  );
};
