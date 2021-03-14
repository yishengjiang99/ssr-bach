export class RangeUnionAmount {
  constructor(
    private _operator: number,
    private lo: number,
    private hi: number
  ) {}
  get operator() {
    return this._operator;
  }
  get range() {
    return { lo: this.lo, hi: this.hi };
  }
  get amount() {
    return this.lo | (this.hi << 8);
  }
  get signed() {
    return this.hi & 0x80
      ? -0x10000 + (this.lo | (this.hi << 8))
      : this.lo | (this.hi << 8);
  }
}
