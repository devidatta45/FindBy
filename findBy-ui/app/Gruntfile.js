module.exports = function (grunt) {

    var commonUrl = grunt.option('commonUrl') || 'localhost';

    // Configure grunt here
    grunt.initConfig({
        concurrent: {
            target: {
                tasks: ["cssmin", "ts:app"],
                options: {
                    logConcurrentOutput: true,
                    declaration: true
                }
            },
            tests: {
                tasks: ["ts:app", "ts:test", "karma:debug"],
                options: {
                    logConcurrentOutput: true
                }
            }
        },

        ts: {
            options: {
                logConcurrentOutput: true,
                sourceMap: true,
                declaration: true
            },
            app: {                          // a particular target
                src: ["controller/*.ts"], // The source typescript files, http://gruntjs.com/configuring-tasks#files
                html: ["sd-ui/app/feature/sd/scripts/**/*.html"], // The source html files, https://github.com/basarat/grunt-ts#html-2-typescript-support
                out: 'trial.js'
                // watch: 'sd-ui/app/feature/sd/scripts'
                // If specified, generate an out.js file which is the merged js file
            },

            test: {                          // a particular target
                src: ["sd-ui/app/feature/sd/tests/unit/specs/**/*.ts"],
                out: 'sd-ui/app/feature/sd/tests/unit/specs/sdSpecs.js',
                watch: 'sd-ui/app/feature/sd/tests/unit/specs'
            },
            testRun: {                          // a particular target
                src: ["sd-ui/app/feature/sd/tests/unit/specs/**/*.ts"],
                out: 'sd-ui/app/feature/sd/tests/unit/specs/sdSpecs.js'
            }

        },
        karma: {
            debug: {
                configFile: 'karma.conf.js',
            },
            run: {
                configFile: 'karma.conf.js',
                singleRun: true,
                browsers: ['PhantomJS']
            }
        },
        uglify: {
            main: {
                files: {
                    'sd-ui/app/feature/sd/scripts/sd.min.js': ['sd-ui/app/feature/sd/scripts/sd.js']
                }
            }
        },
        cssmin: {
            target: {
                files: [{
                    expand: true,
                    cwd: 'sd-ui/app/feature/sd/css',
                    src: ['**/*.css', '!*.min.css'],
                    dest: 'sd-ui/app/feature/sd/css',
                    ext: '.min.css'
                }]
            }
        },
        injector: {
            options: {
                addRootSlash: false,
                ignorePath: ["sd-ui/app/", "feature/security/"]
            },
            debug: {
                files: {
                    'sd-ui/app/index.html': [
                        'sd-ui/app/scripts/commonTemplates.js',
                        'sd-ui/app/scripts/common.min.js',
                        'sd-ui/app/feature/sd/lib/alasql.min.js',
                        'sd-ui/app/feature/sd/lib/xlsx.core.min.js',
                        'sd-ui/app/feature/sd/scripts/sd.js',

                        'sd-ui/app/feature/sd/css/sd.css', 'sd-ui/bower_components/angular-material/angular-material.min.css',],
                    'sd-ui/app/feature/security/index.html': ['sd-ui/app/feature/security/scripts/security.js'],
                }
            },
            deploy: {
                files: {
                    'sd-ui/app/index.html': [
                        'sd-ui/app/scripts/commonTemplates.js',
                        'sd-ui/app/scripts/common.min.js',
                        'sd-ui/app/feature/sd/lib/alasql.min.js',
                        'sd-ui/app/feature/sd/lib/xlsx.core.min.js',
                        'sd-ui/app/feature/sd/scripts/sd.min.js',
                        'sd-ui/app/feature/sd/css/sd.min.css', 'sd-ui/bower_components/angular-material/angular-material.min.css',],
                    'sd-ui/app/feature/security/index.html': ['sd-ui/app/feature/security/scripts/security.min.js'],
                }
            },
        },
        replace: {
            options: {
                usePrefix: false
            },
            debug: {
                options: {
                    patterns: [
                        {
                            match: '"sd-ui/bower_components/',
                            replacement: '"../bower_components/'
                        },
                        {
                            match: '<script src=',
                            replacement: '<script type="text/javascript" src='
                        }
                    ]
                },
                files: [
                    { 'sd-ui/app/index.html': ['sd-ui/app/index.html'] }
                ]
            },
            replaceLibraries: {
                options: {
                    usePrefix: false,
                    patterns: [
                        {
                            match: 'src="../bower_components/',
                            replacement: 'src="http://' + commonUrl + '/common/bower_components/'
                        },
                        {
                            match: 'src="scripts/',
                            replacement: 'src="http://' + commonUrl + '/common/app/scripts/'
                        },
                        {
                            match: 'href="../bower_components/',
                            replacement: 'href="http://' + commonUrl + '/common/bower_components/'
                        },
                        {
                            match: 'href="css/',
                            replacement: 'href="http://' + commonUrl + '/common/app/css/'
                        },
                        {
                            match: 'href="fonts/',
                            replacement: 'href="http://' + commonUrl + '/common/app/fonts/'
                        }
                    ]
                },
                files: [
                    { 'sd-ui/app/index.html': ['sd-ui/app/index.html'] }
                ]
            },
            replaceCommonScripts: {
                options: {
                    usePrefix: false,
                    patterns: [
                        {
                            match: 'src="scripts/common.js',
                            replacement: 'src="http://' + commonUrl + '/common/app/scripts/common.min.js'
                        }, {
                            match: 'src="scripts/common.min.js',
                            replacement: 'src="http://' + commonUrl + '/common/app/scripts/common.min.js'
                        },
                        {
                            match: 'src="scripts/commonTemplates.js',
                            replacement: 'src="http://' + commonUrl + '/common/app/scripts/commonTemplates.js'
                        }
                    ]
                },
                files: [
                    { 'sd-ui/app/index.html': ['sd-ui/app/index.html'] }
                ]
            }

        },
        copy: {
            main: {
                files: [
                    { expand: true, cwd: 'sd-ui/bower_components/common-ui/common-ui/app/', src: ['**'], dest: 'sd-ui/app/' }
                ]
            }
        },
        processhtml: {
            dist: {
                files: {
                    'sd-ui/app/views/layout/navigation.html': 'sd-ui/app/views/layout/navigation.html'
                }
            }
        },
        connect: {
            server: {
                options: {
                    port: 9005,
                    base: '',
                    keepalive: true,
                    open: {
                        target: 'http://localhost:9005/index.html#'
                    }
                }
            }
        },
        html2js: {
            options: {
                // custom options, see below
                base: "sd-ui/app/",
                singleModule: "true",
                module: "sdTemplates"
                // htmlmin: {
                //     collapseBooleanAttributes: true,
                //     collapseWhitespace: true,
                //     removeAttributeQuotes: true,
                //     removeComments: true,
                //     removeEmptyAttributes: true,
                //     removeRedundantAttributes: true,
                //     removeScriptTypeAttributes: true,
                //     removeStyleLinkTypeAttributes: true
                // }
            },
            main: {
                src: ['sd-ui/app/feature/sd/views/**/*.html', 'sd-ui/app/feature/sd/scripts/components/**/*.html'],
                dest: 'sd-ui/app/feature/sd/scripts/sdTemplates.js'
            }
        }

    });

    grunt.registerTask('updateModuleDependencies', function (key, value) {
        var moduleDependenciesFilePath = "sd-ui/app/scripts/module-dependencies.json";

        if (!grunt.file.exists(moduleDependenciesFilePath)) {
            grunt.log.error("file " + moduleDependenciesFilePath + " not found");
            return true;//return false to abort the execution
        }
        var moduleDependencies = grunt.file.readJSON(moduleDependenciesFilePath);//get file as json object

        moduleDependencies["featureJsonFilePath"] = "http://" + commonUrl + "/common/app/scripts/FeatureJsonMetadata.json";//edit the value of json object, you can also use projec.key if you know what you are updating

        grunt.file.write(moduleDependenciesFilePath, JSON.stringify(moduleDependencies, null, 2));//serialize it back to file
    });

    // load the task
    grunt.loadNpmTasks('grunt-concurrent');
    grunt.loadNpmTasks("grunt-ts");
    grunt.loadNpmTasks("grunt-karma");
    grunt.loadNpmTasks("grunt-contrib-copy");
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-injector');
    grunt.loadNpmTasks('grunt-replace');
    grunt.loadNpmTasks('grunt-processhtml');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-html2js');


    // register the defaults
    grunt.registerTask("default", ["cssmin", "concurrent:target"]);
    grunt.registerTask("test", ["html2js:main", "concurrent:tests"]);
    grunt.registerTask("local", ["cssmin", "copy:main", "ts:app", "injector:debug", "replace:debug", "processhtml"]);
    grunt.registerTask("deploy", ["cssmin", "copy:main", "ts:app", "uglify", "replace:replaceLibraries", "injector:deploy", "replace:debug", "replace:replaceCommonScripts", "updateModuleDependencies", "processhtml","html2js:main","ts:testRun", "karma:run"]);
    grunt.registerTask("start", ["connect:server"]);
}

