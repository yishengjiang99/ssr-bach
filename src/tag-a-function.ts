export const tagFunction = (fn: (str: string) => void): any => {
  return function tag(str: TemplateStringsArray, ...args: string[]) {
    for (const i in args) {
      fn(str[i]);
      fn(args[i]);
    }
    fn(str[str.length - 1]);
  };
};
