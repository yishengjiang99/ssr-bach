export const attenuate2gain = (cent: number) => Math.pow(10, cent / -200);
export const centone2hz = (cent: number) => Math.pow(2, cent / 1200) * 8.176;
export const centibel2regularamp = (centible: number) =>
  Math.pow(10, centible / 200);
export const centtime2sec = (centtime: number) => Math.pow(2, centtime / 1200);
