export function gheap(
	pages,
	stacktop = 0x7fff
): {
	heap: Uint8Array;
	sbrk: (size: number) => number;
} {
	const memory = new WebAssembly.Memory({
		initial: pages,
	});
	let heap = new Uint8Array(memory.buffer);
	let brk = stacktop;
	const sbrk = function (size) {
		const old = brk;
		brk += size;
		if (brk > heap.length) {
			memory.grow(Math.ceil((brk - heap.length) / 65536));
			heap = new Uint8Array(memory.buffer);
		}
		return old;
	};
	return {
		heap,
		sbrk,
	};
}
