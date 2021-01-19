const wbook = new Workbook();

const ws = wbook.addWorksheet(filename+".xsl", {
  properties: { showGridLines: true },
  pageSetup: {
    fitToWidth: 1,
    margins: {
      left: 0.7,
      right: 0.7,
      top: 0.75,
      bottom: 0.75,
      header: 0.3,
      footer: 0.3,
    },
  },
  headerFooter: { firstHeader: "Hello Exceljs", firstFooter: "Hello World" },
  state: "visible",
});
fetch("https://${this.host}:${this.port}/excel/${basename(file)}").then(async res=>{
  const reader = res.body.getReader();
  while(true){
    let {done, value}= await reader.read();
    if(!value)
    if(done) break;
    let row = new Array(88).fill(' ');
    let lbreak = value.indexOf(0x0a);
    while(lbreak >=0 && value.length){
      const line = value.slice(0, lbreak);
      value = value.slice(lbreak);
      ws.addRow(line.toString().split(',').reduce((map, val,index,arr)=>{
        map[index+""]=val;
        return map;
      },[])).commit();
      lbreak = value.indexOf(0x0a);   
    }
  }
})