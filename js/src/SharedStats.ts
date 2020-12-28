// export class SharedStats {
//   stats: BigUint64Array;
//   constructor() {
//     this.stats = new BigUint64Array(new SharedArrayBuffer(1024));
//   }

//   get bytesInMemory(): bigint {
//     return Atomics.load(this.stats, 0);
//   }
//   get downloadedBytes(): bigint {
//     return Atomics.load(this.stats, 1);
//   }
//   get latency(): bigint {
//     return Atomics.load(this.stats, 2);
//   }

//   set bytesInMemory(n) {
//     Atomics.store(this.stats, 0, n);
//   }
//   set downloadedBytes(n) {
//     Atomics.store(this.stats, 1, n);
//   }
//   set latency(n) {
//     Atomics.store(this.stats, 2, n);
//   }
// }
