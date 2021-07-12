"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PDTA = void 0;

var _Zone = require("./Zone.js");

class PDTA {
  constructor(r) {
    var _this = this;

    this.phdr = [];
    this.pbag = [];
    this.pgen = [];
    this.pmod = [];
    this.iheaders = [];
    this.igen = [];
    this.imod = [];
    this.ibag = [];
    this.shdr = [];

    this.findPreset = function (pid) {
      var bank_id = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
      var key = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : -1;
      var vel = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : -1;
      var [phdr, pbag, shdr] = [_this.phdr, _this.pbag, _this.shdr];
      var phd,
          i = 0;

      for (i = 0; i < phdr.length - 1; i++) {
        if (phdr[i].presetId != pid || phdr[i].bankId != bank_id) {
          continue;
        }

        phd = phdr[i];
        break;
      }

      if (!phd) return [];
      var presetDefault = pbag[phd.pbagIndex];
      var pbagEnd = phdr[i + 1].pbagIndex;
      return pbag.slice(phd.pbagIndex, pbagEnd).filter(pbg => pbg.pzone.instrumentID >= 0).filter(pbg => keyVelInRange(pbg.pzone, key, vel)).map(pbg => {
        var {
          defaultBg,
          izones
        } = _this.findInstrument(pbg.pzone.instrumentID, key, vel);

        return izones.map(iz => makeRuntime(iz, defaultBg, pbg, presetDefault.pzone, shdr[iz.sampleID]));
      }).flat();
    };

    this.findInstrument = function (instId) {
      var key = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : -1;
      var vel = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : -1;
      var [ibag, iheaders] = [_this.ibag, _this.iheaders];
      var ihead = iheaders[instId];
      return {
        inst: ihead,
        defaultBg: ibag[ihead.iBagIndex].izone,
        izones: ibag.slice(ihead.iBagIndex, iheaders[instId + 1].iBagIndex).filter(ibg => keyVelInRange(ibg.izone, key, vel)).filter(ibg => ibg.izone.sampleID > -1 && _this.shdr[ibg.izone.sampleID]).map(ibg => ibg.izone)
      };
    };

    var n = 0;

    do {
      var ShdrLength = 46;
      var imodLength = 10;
      var phdrLength = 38;
      var pbagLength = 4;
      var pgenLength = 4,
          igenLength = 4;
      var pmodLength = 10;
      var instLength = 22;
      var sectionName = r.read32String();
      var sectionSize = r.get32();
      console.log(sectionName, sectionSize);

      switch (sectionName) {
        case 'phdr':
          for (var i = 0; i < sectionSize; i += phdrLength) {
            var phdrItem = {
              name: r.readNString(20),
              presetId: r.get16(),
              bankId: r.get16(),
              pbagIndex: r.get16(),
              misc: [r.get32(), r.get32(), r.get32()],
              pbags: [],
              insts: [],
              _defaultBag: -1,

              get defaultBag() {
                return this._defaultBag > -1 ? this._defaultBag : this.pbags[0];
              },

              set defaultBag(value) {
                this._defaultBag = value;
              }

            };
            this.phdr.push(phdrItem);
          }

          break;

        case 'pbag':
          for (var _i = 0; _i < sectionSize; _i += pbagLength) {
            this.pbag.push({
              pgen_id: r.get16(),
              pmod_id: r.get16(),
              pzone: new _Zone.SFZone({
                pbagId: _i
              })
            });
          }

          break;

        case 'pgen':
          {
            var pgenId = 0,
                pbagId = 0,
                phdrId = 0;

            for (; pgenId < sectionSize / pgenLength; pgenId++) {
              var opid = r.get8();
              r.get8();
              var v = r.getS16();
              var pg = new _Zone.SFGenerator(opid, v);
              this.pgen.push(pg);
              if (pg.operator == 60) break;
              this.pbag[pbagId].pzone.applyGenVal(pg, pgenId);

              if (this.pbag[pbagId + 1] && pgenId >= this.pbag[pbagId + 1].pgen_id - 1) {
                if (pbagId >= this.phdr[phdrId + 1].pbagIndex) {
                  phdrId++;
                }

                this.addPbagToPreset(pbagId, phdrId);
                pbagId++;
              }
            }

            break;
          }

        case 'pmod':
          for (var _i2 = 0; _i2 < sectionSize; _i2 += pmodLength) {
            this.pmod.push({
              src: r.get16(),
              dest: r.get16(),
              amt: r.get16(),
              amtSrc: r.get16(),
              transpose: r.get16()
            });
          }

          break;

        case 'inst':
          for (var _i3 = 0; _i3 < sectionSize; _i3 += instLength) {
            this.iheaders.push({
              name: r.readNString(20),
              iBagIndex: r.get16(),
              ibags: [],
              defaultIbag: -1
            });
          }

          break;

        case 'ibag':
          {
            var ibginst = 0;

            for (var _i4 = 0; _i4 < sectionSize; _i4 += pbagLength) {
              if (this.iheaders[ibginst + 1] && _i4 >= this.iheaders[ibginst + 1].iBagIndex) ibginst++;
              this.ibag.push({
                igen_id: r.get16(),
                imod_id: r.get16(),
                izone: new _Zone.SFZone({
                  ibagId: _i4
                })
              });
              this.psh(ibginst, _i4, pbagLength);
            } //.push({ igen_id: -1, imod_id: 0, izone: new SFZone() });


            this.ibag.push({
              igen_id: -1,
              imod_id: 0,
              izone: new _Zone.SFZone()
            });
            break;
          }

        case 'igen':
          {
            var ibagId = 0;

            for (var igenId = 0; igenId < sectionSize / igenLength; igenId++) {
              var _opid = r.get8() | r.get8() << 8;

              if (_opid == -1) break;

              var _v = r.getS16();

              var gen = new _Zone.SFGenerator(_opid, _v);
              this.igen.push(gen);
              if (gen.operator === 60) break;
              this.ibag[ibagId].izone.applyGenVal(gen);

              if (igenId >= this.ibag[ibagId + 1].igen_id - 1) {
                ibagId++;
              }
            }

            break;
          }

        case 'imod':
          for (var _i5 = 0; _i5 < sectionSize; _i5 += imodLength) {
            this.imod.push({
              src: r.get16(),
              dest: r.get16(),
              amt: r.get16(),
              amtSrc: r.get16(),
              transpose: r.get16()
            });
          }

          break;

        case 'shdr':
          for (var _i6 = 0; _i6 < sectionSize; _i6 += ShdrLength ///20 + 4 * 5 + 1 + 1 + 4)
          ) {
            this.shdr.push({
              name: r.readNString(20),
              start: r.get32(),
              end: r.get32(),
              startLoop: r.get32(),
              endLoop: r.get32(),
              sampleRate: r.get32(),
              originalPitch: r.get8(),
              pitchCorrection: r.get8(),
              sampleLink: r.get16(),
              sampleType: r.get16()
            });
          }

          break;

        default:
          break;
      }
    } while (n++ <= 9);
  }

  addPbagToPreset(pbagId, phdrId) {
    var _a, _b;

    if (this.pbag[pbagId].pzone.instrumentID == -1) {
      if (this.phdr[phdrId].defaultBag == -1) this.phdr[phdrId].defaultBag = pbagId;
    } else {
      (_a = this.phdr[phdrId]) === null || _a === void 0 ? void 0 : _a.pbags.push(pbagId);
      (_b = this.phdr[phdrId]) === null || _b === void 0 ? void 0 : _b.insts.push(this.pbag[pbagId].pzone.instrumentID);
    }
  }

  psh(ibginst, i, pbagLength) {
    var _a;

    this.iheaders[ibginst].ibags && ((_a = this.iheaders[ibginst].ibags) === null || _a === void 0 ? void 0 : _a.push(i / pbagLength));
  }

  getIbagZone(ibagId) {
    return this.ibag[ibagId] && this.ibag[ibagId].izone;
  }

}

exports.PDTA = PDTA;

function makeRuntime(izone, instDefault, pbg, defaultPbag, shr) {
  var output = new _Zone.SFZone();

  for (var i = 0; i < 60; i++) {
    if (izone.generators[i]) {
      output.setVal(izone.generators[i]);
    } else if (instDefault && instDefault.generators[i]) {
      output.setVal(instDefault.generators[i]);
    }

    if (pbg.pzone.generators[i]) {
      output.increOrSet(pbg.pzone.generators[i]);
    } else if (defaultPbag && defaultPbag.generators[i]) {
      output.increOrSet(defaultPbag.generators[i]);
    }
  }

  output.applyGenVals();
  output.sample = shr;
  return output;
}

function keyVelInRange(zone, key, vel) {
  return (key < 0 || zone.keyRange.lo <= key && zone.keyRange.hi >= key) && (vel < 0 || zone.velRange.lo <= vel && zone.velRange.hi >= vel);
}