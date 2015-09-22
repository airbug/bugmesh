/*
 * Copyright (c) 2015 airbug Inc. http://airbug.com
 *
 * bugcore may be freely distributed under the MIT license.
 */


//-------------------------------------------------------------------------------
// Annotations
//-------------------------------------------------------------------------------

//@Export('bugmesh.MeshSynchronization')

//@Require('Class')
//@Require('Obj')


//-------------------------------------------------------------------------------
// Context
//-------------------------------------------------------------------------------

require('bugpack').context("*", function(bugpack) {

    //-------------------------------------------------------------------------------
    // BugPack
    //-------------------------------------------------------------------------------

    var Class               = bugpack.require('Class');
    var Obj                 = bugpack.require('Obj');


    //-------------------------------------------------------------------------------
    // Declare Class
    //-------------------------------------------------------------------------------

    /**
     * @class
     * @extends {Obj}
     */
    var MeshSynchronization = Class.extend(Obj, {

        _name: "bugmesh.MeshSynchronization",


        //-------------------------------------------------------------------------------
        // Constructor
        //-------------------------------------------------------------------------------

        /**
         * @constructs
         * @param {*} key
         * @param {function()} syncMethod
         */
        _constructor: function(key, syncMethod) {

            this._super();


            //-------------------------------------------------------------------------------
            // Public Properties
            //-------------------------------------------------------------------------------

            /**
             * @private
             * @type {*}
             */
            this.key            = key;

            //NOTE BRN: This method should accept a promise or flow as a return value. It should also pass along an object that can be executed as a callback and have a method obj.release() called on it
            /**
             * @private
             * @type {function()}
             */
            this.syncMethod     = syncMethod;
        },


        //-------------------------------------------------------------------------------
        // Getters and Setters
        //-------------------------------------------------------------------------------

        /**
         * @return {*}
         */
        getKey: function() {
            return this.key;
        },

        /**
         * @return {function()}
         */
        getSyncMethod: function() {
            return this.syncMethod;
        }


        //-------------------------------------------------------------------------------
        // Public Methods
        //-------------------------------------------------------------------------------


    });


    //-------------------------------------------------------------------------------
    // Static Methods
    //-------------------------------------------------------------------------------

    /**
     * @static
     * @param {*} key
     * @param {function()} syncMethod
     * @return {MeshSynchronization}
     */
    MeshSynchronization.synchronization = function(key, syncMethod) {
        return new MeshSynchronization(key, syncMethod);
    };


    //-------------------------------------------------------------------------------
    // Exports
    //-------------------------------------------------------------------------------

    bugpack.export('bugmesh.MeshSynchronization', MeshSynchronization);
});
