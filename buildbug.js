/*
 * Copyright (c) 2014 airbug inc. http://airbug.com
 *
 * bugmesh may be freely distributed under the MIT license.
 */


//-------------------------------------------------------------------------------
// Requires
//-------------------------------------------------------------------------------

var buildbug            = require('buildbug');


//-------------------------------------------------------------------------------
// Simplify References
//-------------------------------------------------------------------------------

var buildProject        = buildbug.buildProject;
var buildProperties     = buildbug.buildProperties;
var buildScript         = buildbug.buildScript;
var buildTarget         = buildbug.buildTarget;
var enableModule        = buildbug.enableModule;
var parallel            = buildbug.parallel;
var series              = buildbug.series;
var targetTask          = buildbug.targetTask;


//-------------------------------------------------------------------------------
// Enable Modules
//-------------------------------------------------------------------------------

var aws                 = enableModule("aws");
var bugpack             = enableModule('bugpack');
var bugunit             = enableModule('bugunit');
var core                = enableModule('core');
var lintbug             = enableModule("lintbug");
var nodejs              = enableModule('nodejs');


//-------------------------------------------------------------------------------
// Values
//-------------------------------------------------------------------------------

var name                = "bugmesh";
var version             = "0.0.1";
var dependencies        = {
    bugpack: "0.2.0",
    redis: "0.12.1"
};


//-------------------------------------------------------------------------------
// BuildProperties
//-------------------------------------------------------------------------------

buildProperties({
    name: name,
    version: version
});

buildProperties({
    node: {
        packageJson: {
            name: "{{name}}",
            version: "{{version}}",
            description: "BugMesh is a synchronization library written in JS for concurrent programming across multiple processes.",
            main: "./scripts/bugmesh-node.js",
            dependencies: dependencies,
            author: "Brian Neisler <brian@airbug.com>",
            repository: {
                type: "git",
                url: "https://github.com/airbug/bugmesh.git"
            },
            bugs: {
                url: "https://github.com/airbug/bugmesh/issues"
            },
            licenses: [
                {
                    type : "MIT",
                    url : "https://raw.githubusercontent.com/airbug/bugmesh/master/LICENSE"
                }
            ]
        },
        sourcePaths: [
            "../bugcore/libraries/bugcore/js/src",
            "./libraries/bugmesh/js/src"
        ],
        scriptPaths: [
            "./projects/bugmesh-node/js/scripts"
        ],
        readmePath: "./README.md",
        unitTest: {
            packageJson: {
                name: "{{name}}-test",
                version: "{{version}}",
                main: "./scripts/bugmesh-node.js",
                dependencies: dependencies,
                private: true,
                scripts: {
                    test: "node ./test/scripts/bugunit-run.js"
                }
            },
            sourcePaths: [
                "../buganno/libraries/buganno/js/src",
                "../bugdouble/libraries/bugdouble/js/src",
                "../bugmesh/libraries/bugmesh/js/src",
                "../bugmeta/libraries/bugmeta/js/src",
                "../bugunit/libraries/bugunit/js/src",
                "../bugyarn/libraries/bugyarn/js/src"
            ],
            scriptPaths: [
                "../buganno/libraries/buganno/js/scripts",
                "../bugunit/libraries/bugunit/js/scripts"
            ],
            testPaths: [
                "../bugcore/libraries/bugcore/js/test",
                "./libraries/bugmesh/js/test"
            ]
        }
    },
    lint: {
        targetPaths: [
            "."
        ],
        ignorePatterns: [
            ".*\\.buildbug$",
            ".*\\.bugunit$",
            ".*\\.git$",
            ".*node_modules$"
        ]
    }
});


//-------------------------------------------------------------------------------
// BuildTargets
//-------------------------------------------------------------------------------

// Clean BuildTarget
//-------------------------------------------------------------------------------

buildTarget('clean').buildFlow(
    targetTask('clean')
);


// Local BuildTarget
//-------------------------------------------------------------------------------

buildTarget('local').buildFlow(
    series([
        targetTask('clean'),
        targetTask('lint', {
            properties: {
                targetPaths: buildProject.getProperty("lint.targetPaths"),
                ignores: buildProject.getProperty("lint.ignorePatterns"),
                lintTasks: [
                    "cleanupExtraSpacingAtEndOfLines",
                    "ensureNewLineEnding",
                    "indentEqualSignsForPreClassVars",
                    "orderBugpackRequires",
                    "orderRequireAnnotations",
                    "updateCopyright"
                ]
            }
        }),
        series([
            targetTask('createNodePackage', {
                properties: {
                    packageJson: buildProject.getProperty("node.packageJson"),
                    packagePaths: {
                        "./": [buildProject.getProperty("node.readmePath")],
                        "./lib": buildProject.getProperty("node.sourcePaths"),
                        "./scripts": buildProject.getProperty("node.scriptPaths"),
                        "./test": buildProject.getProperty("node.unitTest.testPaths"),
                        "./test/lib": buildProject.getProperty("node.unitTest.sourcePaths"),
                        "./test/scripts": buildProject.getProperty("node.unitTest.scriptPaths")
                    }
                }
            }),
            targetTask('generateBugPackRegistry', {
                init: function(task, buildProject, properties) {
                    var nodePackage = nodejs.findNodePackage(
                        buildProject.getProperty("node.packageJson.name"),
                        buildProject.getProperty("node.packageJson.version")
                    );
                    task.updateProperties({
                        sourceRoot: nodePackage.getBuildPath()
                    });
                }
            }),
            targetTask('packNodePackage', {
                properties: {
                    packageName: "{{node.packageJson.name}}",
                    packageVersion: "{{node.packageJson.version}}"
                }
            }),
            targetTask('startNodeModuleTests', {
                init: function(task, buildProject, properties) {
                    var packedNodePackage = nodejs.findPackedNodePackage(
                        buildProject.getProperty("node.packageJson.name"),
                        buildProject.getProperty("node.packageJson.version")
                    );
                    task.updateProperties({
                        modulePath: packedNodePackage.getFilePath()
                        //checkCoverage: true
                    });
                }
            }),
            targetTask("s3PutFile", {
                init: function(task, buildProject, properties) {
                    var packedNodePackage = nodejs.findPackedNodePackage(buildProject.getProperty("node.packageJson.name"),
                        buildProject.getProperty("node.packageJson.version"));
                    task.updateProperties({
                        file: packedNodePackage.getFilePath(),
                        options: {
                            acl: 'public-read',
                            encrypt: true
                        }
                    });
                },
                properties: {
                    bucket: "{{local-bucket}}"
                }
            })
        ])
    ])
).makeDefault();


// Prod BuildTarget
//-------------------------------------------------------------------------------

buildTarget('prod').buildFlow(
    series([
        targetTask('clean'),
        targetTask('lint', {
            properties: {
                targetPaths: buildProject.getProperty("lint.targetPaths"),
                ignores: buildProject.getProperty("lint.ignorePatterns"),
                lintTasks: [
                    "cleanupExtraSpacingAtEndOfLines",
                    "ensureNewLineEnding",
                    "indentEqualSignsForPreClassVars",
                    "orderBugpackRequires",
                    "orderRequireAnnotations",
                    "updateCopyright"
                ]
            }
        }),
        parallel([

            //Create test node bugmesh package

            series([
                targetTask('createNodePackage', {
                    properties: {
                        packageJson: buildProject.getProperty("node.unitTest.packageJson"),
                        packagePaths: {
                            "./lib": buildProject.getProperty("node.sourcePaths"),
                            "./scripts": buildProject.getProperty("node.scriptPaths"),
                            "./test": buildProject.getProperty("node.unitTest.testPaths"),
                            "./test/lib": buildProject.getProperty("node.unitTest.sourcePaths"),
                            "./test/scripts": buildProject.getProperty("node.unitTest.scriptPaths")
                        }
                    }
                }),
                targetTask('generateBugPackRegistry', {
                    init: function(task, buildProject, properties) {
                        var nodePackage = nodejs.findNodePackage(
                            buildProject.getProperty("node.unitTest.packageJson.name"),
                            buildProject.getProperty("node.unitTest.packageJson.version")
                        );
                        task.updateProperties({
                            sourceRoot: nodePackage.getBuildPath()
                        });
                    }
                }),
                targetTask('packNodePackage', {
                    properties: {
                        packageName: "{{node.unitTest.packageJson.name}}",
                        packageVersion: "{{node.unitTest.packageJson.version}}"
                    }
                }),
                targetTask('startNodeModuleTests', {
                    init: function(task, buildProject, properties) {
                        var packedNodePackage = nodejs.findPackedNodePackage(
                            buildProject.getProperty("node.unitTest.packageJson.name"),
                            buildProject.getProperty("node.unitTest.packageJson.version")
                        );
                        task.updateProperties({
                            modulePath: packedNodePackage.getFilePath(),
                            checkCoverage: true
                        });
                    }
                })
            ]),

            // Create production node bugmesh package

            series([
                targetTask('createNodePackage', {
                    properties: {
                        packageJson: buildProject.getProperty("node.packageJson"),
                        packagePaths: {
                            "./": [buildProject.getProperty("node.readmePath")],
                            "./lib": buildProject.getProperty("node.sourcePaths"),
                            "./scripts": buildProject.getProperty("node.scriptPaths")
                        }
                    }
                }),
                targetTask('generateBugPackRegistry', {
                    init: function(task, buildProject, properties) {
                        var nodePackage = nodejs.findNodePackage(
                            buildProject.getProperty("node.packageJson.name"),
                            buildProject.getProperty("node.packageJson.version")
                        );
                        task.updateProperties({
                            sourceRoot: nodePackage.getBuildPath()
                        });
                    }
                }),
                targetTask('packNodePackage', {
                    properties: {
                        packageName: "{{node.packageJson.name}}",
                        packageVersion: "{{node.packageJson.version}}"
                    }
                }),
                targetTask("s3PutFile", {
                    init: function(task, buildProject, properties) {
                        var packedNodePackage = nodejs.findPackedNodePackage(buildProject.getProperty("node.packageJson.name"),
                            buildProject.getProperty("node.packageJson.version"));
                        task.updateProperties({
                            file: packedNodePackage.getFilePath(),
                            options: {
                                acl: 'public-read',
                                encrypt: true
                            }
                        });
                    },
                    properties: {
                        bucket: "{{prod-deploy-bucket}}"
                    }
                }),
                targetTask('npmConfigSet', {
                    properties: {
                        config: buildProject.getProperty("npmConfig")
                    }
                }),
                targetTask('npmAddUser'),
                targetTask('publishNodePackage', {
                    properties: {
                        packageName: "{{node.packageJson.name}}",
                        packageVersion: "{{node.packageJson.version}}"
                    }
                })
            ])
        ])
    ])
);


//-------------------------------------------------------------------------------
// Build Scripts
//-------------------------------------------------------------------------------

buildScript({
    dependencies: [
        "bugcore",
        "bugflow",
        "bugmesh"
    ],
    script: "./lintbug.js"
});
