import { execSync } from "child_process";
import { readFileSync, link } from "fs";
var express = require("express");
var upload = require("multer")({ dest: "uploads/" });
/**
 * Load the models.
 */

export const fileserver = () => {
  var app = express();

  app.post("/fs", upload.single("file"), function (req, res, next) {
    // req.file is the `avatar` file
    // req.body will hold the text fields, if there were any
    if (!req.file || !req.file.path) {
      return res.writeHead(400);
    }
    const destname = "./midi/" + req.file.originalname;
    execSync("mv " + req.file.path + " " + destname);
    res.redirect("midi/" + req.file.originalname);
  });

  //+originalName)
  return app;
};
