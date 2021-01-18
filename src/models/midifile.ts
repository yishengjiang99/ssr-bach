"use strict";

export const Midifile = function (sequelize, DataTypes) {
  var Midifile = sequelize.define("midifile", {
    path: { type: DataTypes.STRING, allowNull: false },
    url: { type: DataTypes.STRING, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    length: { type: DataTypes.Integer, allowNull: false },
    meta: { type: DataTypes.JSON, allowNull: false, defaultValue: {} },
  });

  return Midifile;
};
