"use strict";
import * as fs from "fs";
var path = require("path");
var Sequelize = require("sequelize");
var basename = path.basename(module.filename);
var config = require(path.join(__dirname, "/../../config.json")).database;

var sequelize = new Sequelize(config.database, config.username, config.password, config);

export const db = {
  sequalize: sequelize,
};
fs.readdirSync(__dirname)
  .filter(function (file) {
    return file.indexOf(".") !== 0 && file !== basename && file.slice(-3) === ".js";
  })
  .forEach(function (file) {
    var model = sequelize.import(path.join(__dirname, file));
    db[model.name] = model;
  });

Object.keys(db).forEach(function (modelName) {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});
