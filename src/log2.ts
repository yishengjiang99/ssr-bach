// let emulog2;
// export async function init() {
//   const module = await load('./log2.wasm');
//   emulog2 = module.exports.logshort2;
// }

// export const log2 = (n) => {
//   if (emulog2) return emulog2(n);
//   else return Math.log2(n);
// };
// init().then((t) => {
//   for (let i = 0; i < 0x8000; i++) {
//     console.log(log2(1 + i / 0x7fff));
//   }
// });
