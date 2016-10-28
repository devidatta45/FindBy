module.exports = function (grunt) {

    var commonUrl = 'localhost';

    // Configure grunt here
    grunt.initConfig({
        concurrent: {
            target: {
                tasks: ["ts:app"],
                options: {
                    logConcurrentOutput: true,
                    declaration: true
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
                html: ["views/*.html"], // The source html files, https://github.com/basarat/grunt-ts#html-2-typescript-support
                out: 'findBy.js'
                // watch: 'sd-ui/app/feature/sd/scripts'
                // If specified, generate an out.js file which is the merged js file
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
        }
    });
    // load the task
    grunt.loadNpmTasks('grunt-concurrent');
    grunt.loadNpmTasks("grunt-ts");
    grunt.loadNpmTasks('grunt-injector');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-html2js');


    // register the defaults
    grunt.registerTask("default", ["concurrent:target"]);
    grunt.registerTask("start", ["connect:server"]);
}

