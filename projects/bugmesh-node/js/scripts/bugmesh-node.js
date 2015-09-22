/*
 * Copyright (c) 2014 airbug inc. http://airbug.com
 *
 * bugfs may be freely distributed under the MIT license.
 */


//-------------------------------------------------------------------------------
// Script
//-------------------------------------------------------------------------------

var bugpack     = require("bugpack").loadContextSync(module);
bugpack.loadExportSync("bugmesh.BugMesh");
var BugMesh     = bugpack.require("bugmesh.BugMesh");


//-------------------------------------------------------------------------------
// Exports
//-------------------------------------------------------------------------------

module.exports = BugMesh.getInstance();
