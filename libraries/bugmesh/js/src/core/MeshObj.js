/*
 * Copyright (c) 2015 airbug Inc. http://airbug.com
 *
 * bugcore may be freely distributed under the MIT license.
 */


//-------------------------------------------------------------------------------
// Annotations
//-------------------------------------------------------------------------------

//@Export('bugmesh.MeshObj')

//@Require('Class')
//@Require('Obj')
//@Require('bugmesh.Mesh')
//@Require('HashUtil')
//@Require('IdGenerator')
//@Require('ObjectUtil')
//@Require('TypeUtil')


//-------------------------------------------------------------------------------
// Context
//-------------------------------------------------------------------------------

require('bugpack').context("*", function(bugpack) {

    //-------------------------------------------------------------------------------
    // BugPack
    //-------------------------------------------------------------------------------

    var Class           = bugpack.require('Class');
    var Obj             = bugpack.require('Obj');
    var Mesh            = bugpack.require('bugmesh.Mesh');
    var HashUtil        = bugpack.require('HashUtil');
    var IdGenerator     = bugpack.require('IdGenerator');
    var ObjectUtil      = bugpack.require('ObjectUtil');
    var TypeUtil        = bugpack.require('TypeUtil');


    //-------------------------------------------------------------------------------
    // Declare Class
    //-------------------------------------------------------------------------------

    /**
     * @class
     * @extends {Obj}
     */
    var MeshObj = Class.extend(Obj, /** @lends {MeshObj.prototype} */{

        _name: "bugmesh.MeshObj",


        //-------------------------------------------------------------------------------
        // Constructor
        //-------------------------------------------------------------------------------

        /**
         * @constructs
         */
        _constructor: function() {

            this._super();


            //-------------------------------------------------------------------------------
            // Private Properties
            //-------------------------------------------------------------------------------

            /**
             * @private
             * @type {Mesh}
             */
            this._mesh          = null;
        },


        //-------------------------------------------------------------------------------
        // Init Methods
        //-------------------------------------------------------------------------------

        /**
         * @return {MeshObj}
         */
        init: function() {
            this._mesh = Mesh.getInstance();
            return this;
        },


        //-------------------------------------------------------------------------------
        // Getters and Setters
        //-------------------------------------------------------------------------------

        /**
         * @return {Mesh}
         */
        getMesh: function() {
            return this._mesh;
        }
    });


    //-------------------------------------------------------------------------------
    // Exports
    //-------------------------------------------------------------------------------

    bugpack.export('bugmesh.MeshObj', MeshObj);
});
