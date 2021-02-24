"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.s16tof32 = void 0;
const s16tof32 = (i16) => (i16 > 0 ? i16 / 0x7fff : -1 - i16 / 0x8000);
exports.s16tof32 = s16tof32;
