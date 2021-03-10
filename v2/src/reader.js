"use strict";
exports.__esModule = true;
exports.reader = void 0;
var fs_1 = require("fs");
function reader(path) {
    var offset = 0;
    var fd = fs_1.openSync(path, "r");
    var getc = function () {
        var buffer = Buffer.alloc(4);
        fs_1.readSync(fd, buffer, 0, 4, offset);
        offset++;
        return buffer.readUInt8();
    };
    var get8 = function () {
        return getc();
    };
    var get16 = function () {
        return get8() | (get8() << 8);
    };
    var get32 = function () {
        var buffer = Buffer.alloc(16);
        fs_1.readSync(fd, buffer, 0, 16, offset);
        offset += 4;
        return buffer.readUInt32LE(0);
    };
    var read32String = function () {
        return [getc(), getc(), getc(), getc()]
            .map(function (c) {
            return String.fromCharCode(c);
        })
            .join("");
    };
    function fstat() {
        return fs_1.statSync(path);
    }
    var skipped = [];
    function skip(n) {
        skipped.push(offset);
        offset += n;
    }
    function getOffset() {
        return offset;
    }
    function setOffset(n) {
        offset = n;
    }
    function readN(n) {
        var buffer = Buffer.alloc(n);
        fs_1.readSync(fd, buffer, 0, n, offset);
        offset += n;
        return buffer;
    }
    function readNString(n) {
        var buffer = Buffer.alloc(n);
        fs_1.readSync(fd, buffer, 0, n, offset);
        offset += n;
        return buffer.toString("ascii", 0, buffer.indexOf(0x00));
    }
    return {
        getc: getc,
        get8: get8,
        get16: get16,
        read32String: read32String,
        get32: get32,
        fstat: fstat,
        skip: skip,
        getOffset: getOffset,
        setOffset: setOffset,
        readN: readN,
        readNString: readNString
    };
}
exports.reader = reader;
