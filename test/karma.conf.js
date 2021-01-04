module.exports = function (config) {
  config.set({
    basePath: "../",
    frameworks: ["mocha", "karma-typescript"],
    files: [
      "src/*.ts",
      "js/src/*.ts"
    ],
    preprocessors: {
      "**/*.ts": "karma-typescript" // *.tsx for React Jsx
    },
    karmaTypescriptConfig: {
      compilerOptions: {
        target: "es6",
        // module: "commonjs",
      },
      bundlerOptions: {
        resolve: {
          directories: ["src", "node_modules", "test"],
        },
      },
      tsconfig: "./tsconfig.json",
    },
    reporters: ["progress", "karma-typescript"],
    browsers: ["Chrome"],
    plugins: [
      "karma-typescript",
      "karma-mocha",
    ],
    client: {
      mocha: {
        reporter: "html",
        timeout: 10000,
        retries: 2,
        ui: "bdd",
      },
    },
  });
};
