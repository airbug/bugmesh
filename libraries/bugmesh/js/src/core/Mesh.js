/*
 * Copyright (c) 2015 airbug Inc. http://airbug.com
 *
 * bugcore may be freely distributed under the MIT license.
 */


//-------------------------------------------------------------------------------
// Annotations
//-------------------------------------------------------------------------------

//@Export('bugmesh.Mesh')

//@Require('Class')
//@Require('Flows')
//@Require('Obj')
//@Require('Promises')
//@Require('Proxy')
//@Require('TypeUtil')
//@Require('bugmarsh.Marshaller')
//@Require('bugmarsh.MarshRegistry')
//@Require('bugredis.RedisClient')
//@Require('bugredis.RedisConfig')
//@Require('bugredis.RedisPubSub')
//@Require('bugsub.PubSub')


//-------------------------------------------------------------------------------
// Context
//-------------------------------------------------------------------------------

require('bugpack').context("*", function(bugpack) {

    //-------------------------------------------------------------------------------
    // Common Modules
    //-------------------------------------------------------------------------------

    var redis           = require('redis');


    //-------------------------------------------------------------------------------
    // BugPack
    //-------------------------------------------------------------------------------

    var Class           = bugpack.require('Class');
    var Flows           = bugpack.require('Flows');
    var Obj             = bugpack.require('Obj');
    var Promises        = bugpack.require('Promises');
    var Proxy           = bugpack.require('Proxy');
    var TypeUtil        = bugpack.require('TypeUtil');
    var Marshaller      = bugpack.require('bugmarsh.Marshaller');
    var MarshRegistry   = bugpack.require('bugmarsh.MarshRegistry');
    var RedisClient     = bugpack.require('bugredis.RedisClient');
    var RedisConfig     = bugpack.require('bugredis.RedisConfig');
    var RedisPubSub     = bugpack.require('bugredis.RedisPubSub');
    var PubSub          = bugpack.require('bugsub.PubSub');


    //-------------------------------------------------------------------------------
    // Simplify References
    //-------------------------------------------------------------------------------

    var $series                 = Flows.$series;


    //-------------------------------------------------------------------------------
    // Declare Class
    //-------------------------------------------------------------------------------

    /**
     * @class
     * @extends {Obj}
     */
    var Mesh = Class.extend(Obj, /** @lends {Mesh.prototype} */{

        _name: "Obj",


        //-------------------------------------------------------------------------------
        // Constructor
        //-------------------------------------------------------------------------------

        /**
         * @constructs
         */
        _constructor: function() {

            //-------------------------------------------------------------------------------
            // Private Properties
            //-------------------------------------------------------------------------------

            /**
             * @private
             * @type {Marshaller}
             */
            this.marshaller             = null;

            /**
             * @private
             * @type {MarshRegistry}
             */
            this.marshRegistry          = null;

            /**
             * @private
             * @type {number}
             */
            this.meshId                 = null;

            /**
             * @private
             * @type {PubSub}
             */
            this.pubSub                 = null;

            /**
             * @private
             * @type {RedisClient}
             */
            this.redisClient            = null;

            /**
             * @private
             * @type {RedisConfig}
             */
            this.redisConfig            = null;

            /**
             * @private
             * @type {RedisPubSub}
             */
            this.redisPubSub            = null;

            /**
             * @private
             * @type {RedisClient}
             */
            this.subscriberRedisClient  = null;
        },


        //-------------------------------------------------------------------------------
        // Init Methods
        //-------------------------------------------------------------------------------

        /**
         * @return {Mesh}
         */
        init: function() {
            this.marshRegistry          = new MarshRegistry();
            this.marshaller             = new Marshaller(this.marshRegistry);
            this.redisConfig            = new RedisConfig();
            this.redisClient            = new RedisClient(redis, this.redisConfig);
            this.subscriberRedisClient  = new RedisClient(redis, this.redisConfig);
            this.redisPubSub            = new RedisPubSub(this.redisClient, this.subscriberRedisClient);
            this.pubSub                 = new PubSub(this.marshaller, this.redisPubSub);
            return this;
        },


        //-------------------------------------------------------------------------------
        // Getters and Setters
        //-------------------------------------------------------------------------------

        /**
         * @return {number}
         */
        getMeshId: function() {
            return this.meshId;
        },

        /**
         * @return {PubSub}
         */
        getPubSub: function() {
            return this.pubSub;
        },

        /**
         * @return {RedisClient}
         */
        getRedisClient: function() {
            return this.redisClient;
        },

        /**
         * @return {RedisConfig}
         */
        getRedisConfig: function() {
            return this.redisConfig;
        },

        /**
         * @return {RedisClient}
         */
        getSubscriberRedisClient: function() {
            return this.subscriberRedisClient;
        },


        //-------------------------------------------------------------------------------
        // Public Methods
        //-------------------------------------------------------------------------------

        /**
         * @param {{
         *      port: number,
         *      host: string
         * }} configObject
         */
        config: function(configObject) {
            if (TypeUtil.isObject(configObject)) {
                if (TypeUtil.isNumber(configObject.port)) {
                    this.redisConfig.setPort(configObject.port);
                }
                if (TypeUtil.isString(configObject.host)) {
                    this.redisConfig.setHost(configObject.host);
                }
            }
        },

        /**
         * @param {string} hashId
         * @param {string} field
         * @param {string} value
         * @param {function(Throwable, number=)} callback
         */
        hashSet: function(hashId, field, value, callback) {
            this.getRedisClient().hSet(hashId, field, value, callback);
        },

        /**
         * @param {function(Throwable=)} callback
         * @return {Promise}
         */
        initialize: function(callback) {
            var deferred = Promises.deferred();
            deferred.callback(callback);
            this.generateMeshId(function(throwable) {
                if (!throwable) {
                    deferred.resolve();
                } else {
                    deferred.reject(throwable);
                }
            });
            return deferred.promise();
        },


        //-------------------------------------------------------------------------------
        // Private Methods
        //-------------------------------------------------------------------------------

        /**
         * @private
         * @param {function(Throwable=)} callback
         */
        generateMeshId: function(callback) {
            var _this = this;
            if (!this.meshId) {
                this.incrementMeshId(function(throwable, meshId) {
                    if (!throwable) {
                        _this.meshId = meshId;
                    }
                    callback(throwable);
                })
            } else {
                callback();
            }
        },

        /**
         * @private
         * @param {function(Throwable, number=)} callback
         */
        incrementMeshId: function(callback) {
            this.getRedisClient().incr(Mesh.MESH_ID, callback);
        }
    });


    //-------------------------------------------------------------------------------
    // Private Static Properties
    //-------------------------------------------------------------------------------

    /**
     * @static
     * @private
     * @type {Mesh}
     */
    Mesh.instance = null;

    /**
     * @static
     * @private
     * @type {string}
     */
    Mesh.MESH_ID = "MESH_ID";


    //-------------------------------------------------------------------------------
    // Static Methods
    //-------------------------------------------------------------------------------

    /**
     * @static
     * @return {Mesh}
     */
    Mesh.getInstance = function() {
        if (Mesh.instance === null) {
            Mesh.instance = new Mesh();
        }
        return Mesh.instance;
    };


    //-------------------------------------------------------------------------------
    // Proxy Methods
    //-------------------------------------------------------------------------------

    Proxy.proxy(Mesh, Proxy.method(Mesh.getInstance), [
        "config",
        "deinitialize",
        "initialize"
    ]);


    //-------------------------------------------------------------------------------
    // Exports
    //-------------------------------------------------------------------------------

    bugpack.export('bugmesh.Mesh', Mesh);
});
