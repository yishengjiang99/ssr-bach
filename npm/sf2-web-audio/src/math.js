export const attenuate2gain = (cent) => Math.pow(10, cent / -200);
export const centone2hz = (cent) => Math.pow(2, cent / 1200) * 8.176;
export const centibel2regularamp = (centible) => Math.pow(10, centible / 200);
export const centtime2sec = (centtime) => Math.pow(2, centtime / 1200);
