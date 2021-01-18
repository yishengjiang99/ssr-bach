var express = require("express");
var path = require("path");
var logger = require("morgan");
var bodyParser = require("body-parser");
var expresshandlebars = require("express-handlebars");
var express = require("express");

export var app = express();
// view engine setup
app.set("views", path.join(__dirname, "views"));
app.engine(
  "handlebars",
  expresshandlebars({
    layoutsDir: "views",
    defaultLayout: "layout",
  })
);
app.set("view engine", "handlebars");
app.use(logger("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "js")));

// require("./models/index")
//   .sequalize.sync()
//   .then(function () {
//     app.listen(3333);
//   });
