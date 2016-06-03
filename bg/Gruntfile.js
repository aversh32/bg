module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        uglify: {
            development: {
                options: {
                    banner: '// DEVELOPMENT\n',
            //         beautify: true,
                    report: 'gzip'
                },
                src: [
                    //'public/js/socket.io.js',

                    'public/js/widgets.js',
                    'public/js/image_upload.js',
                    'public/js/phones_input.js',
                    'public/js/phone_input.js',
                    'public/js/select_input.js',
                    'public/js/prettyFormatter.js',
                    'public/js/list.js',
                    'public/js/timeGraph.js',
                    'public/js/lengthCounter.js',
                    'public/model/localizer.js',
                    'public/model/query.js',
                    'public/model/user.js',
                    'public/model/statemachine.js',
                    'public/controller/*.js',
                    'public/view/viewport.js',
                    'public/view/stateChange.js',
                    'public/js/jquery.min.js',
                    'public/js/jquery-ui.min.js',
                    /*'public/js/cssua.js',
                    'public/js/sceuocard.js',*/

                    'public/js/gritter.min.js',
                    'public/js/main.js',
                    'public/js/imgProp.js',
                    'public/js/crypto.js'
//                    'public/js/**/*.js'
                ],
                dest: 'public/<%= pkg.name %>.min.js'
            }/*,

            production: {
                options: {
                    banner: '// PRODUCTION\n'
                },
                src: 'public/js/ ** /*.js',
                dest: 'public/dev.<%= pkg.name %>.min.js'
            },

            my_target: {
                options: {
                    compress: {
                        drop_console: true
                    }
                },
                files: [{
                    expand: true,
                    cwd: 'src/js',
                    src: 'public/js/*.js',
                    dest: 'public/dest/js.js'
                }]
            }*/
        }
    });

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-contrib-uglify');

    // Default task(s).
    grunt.registerTask('default', ['uglify']);

};