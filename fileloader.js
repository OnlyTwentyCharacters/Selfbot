"use strict";
// start of fileloader.js
const ignores = require("./ignorelist.json")
exports.ignores = ignores;
const fse = require('fs-extra');
exports.writeChanges = function() {
    fse.writeFileSync("ignorelist.json", JSON.stringify(ignores, null, "\t"));
};
