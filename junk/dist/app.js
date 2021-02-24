"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const fsr_1 = require("./fsr");
var express = require("express");
var path = require("path");
var logger = require("morgan");
var bodyParser = require("body-parser");
var expresshandlebars = require("express-handlebars");
var express = require("express");
exports.app = express();
// view engine setup
exports.app.set("views", path.join(__dirname, "views"));
exports.app.engine("handlebars", expresshandlebars({
    layoutsDir: "views",
    defaultLayout: "layout",
}));
exports.app.set("view engine", "handlebars");
exports.app.use(logger("dev"));
exports.app.use(bodyParser.json());
exports.app.use(bodyParser.urlencoded({ extended: false }));
exports.app.use(express.static(path.join(__dirname, "js")));
exports.app.get("/", fsr_1.queryFs);
// require("./models/index")
//   .sequalize.sync()
//   .then(function () {
//     app.listen(3333);
//   });
