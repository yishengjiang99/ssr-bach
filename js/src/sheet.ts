// @ts-ignore
// If you need to override the default options, you can set the override
// const options = {};
// new Spreadsheet('#x-spreadsheet-demo', options);
const s = new Spreadsheet("", {
  view: {
    height: () => document.documentElement.clientHeight,
    width: () => document.documentElement.clientWidth,
  },
})
  .loadData({ A3: 3 }) // load data
  .change((data) => {
    // save data to db
  });
// data validation
s.validate();
