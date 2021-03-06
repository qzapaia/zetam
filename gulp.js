/*
Important:

Option read:false prevents gulp from reading the contents 
of the file and makes this task a lot faster.
https://www.npmjs.org/package/gulp-clean

*/

var z = require('./');
var path = require('path');
var livereload = require('gulp-livereload');
var browserify = require('browserify');
var transform = require('vinyl-transform');
var source = require('vinyl-source-stream');
var glob = require('glob');
var watchify = require('watchify');
var componentPaths;

var $ = {
    watch:require('gulp-watch'),
    nodemon:require('gulp-nodemon'),
    plumber:require('gulp-plumber'),
    less:require('gulp-less'),
    prefix:require('gulp-autoprefixer'),
    rename:require('gulp-rename'),
    minifyCSS:require('gulp-minify-css'),
    uglify:require('gulp-uglify')
}

var plumberOption = {
    errorHandler:function(e){
        console.log(e);
    }
}

var addEach = function(arr,add){
    var newArr = arr.slice(0);

    for (var i = 0; i < newArr.length; i++) {
        newArr[i] += (typeof add == 'string' ? add : add[i]);
    };
    return newArr;
}

module.exports = function(gulp,conf) {
    conf = conf || {};
    conf.expressPort = conf.expressPort || 3000; 
    conf.paths = conf.paths || [];
    
    var componentPaths = ['./components'].concat(addEach(conf.paths,'/components'));
    var pagesPaths = ['./pages'].concat(addEach(conf.paths,'/pages'));

    gulp.task('less-components', function() {
        return gulp.src(addEach(componentPaths,'/**/styles.less'), {read: false})
            .pipe($.watch())
            .pipe($.plumber(plumberOption))
            .pipe($.less())
            .pipe($.prefix("last 1 version", "> 1%", "ie 8", "ie 7"))
            .pipe($.rename(function(path) {
                path.basename = path.dirname;
                path.dirname = '';
            }))
            .pipe(gulp.dest('./public/zetam/css/components/'))
            .pipe(livereload());
    })

    gulp.task('less-pages', function() {
        return gulp.src(addEach(pagesPaths,'/**/styles.less'), {read: false})
            .pipe($.watch())
            .pipe($.plumber(plumberOption))
            .pipe($.less())
            .pipe($.prefix("last 1 version", "> 1%", "ie 8", "ie 7"))
            .pipe($.rename(function(path) {
                path.basename = path.dirname;
                path.dirname = '';
            }))
            .pipe(gulp.dest('./public/zetam/css/pages/'))
            .pipe(livereload());
    })

    gulp.task('less',['less-components','less-pages']);

    gulp.task('browserify',function(){
        // Browserify
        addEach(componentPaths,'/**/view.js').forEach(function(path){
            glob(path, function(err, files) {
                files.forEach(function(entry) {
                        var w = watchify(browserify({ entries: [entry] }))
                        var build = function(){
                            w.bundle()
                            .pipe(source(entry))
                            .pipe($.plumber(plumberOption))
                            .pipe($.rename(function(path) {
                                path.basename = path.dirname.split('/').pop();
                                path.dirname = '';
                            }))
                            .pipe(gulp.dest('./public/zetam/js/components/'))
                            .pipe(livereload());
                        }
                        w.on('update',build)
                        build();
                });
            });
        })

        addEach(pagesPaths,'/**/view.js').forEach(function(path){
            glob(path, function(err, files) {
                files.forEach(function(entry) {
                        var w = watchify(browserify({ entries: [entry] }))
                        var build = function(){
                            w.bundle()
                            .pipe(source(entry))
                            .pipe($.plumber(plumberOption))
                            .pipe($.rename(function(path) {
                                path.basename = path.dirname.split('/').pop();
                                path.dirname = '';
                            }))
                            .pipe(gulp.dest('./public/zetam/js/pages/'))
                            .pipe(livereload());
                        }
                        w.on('update',build)
                        build();
                });
            });
        });
    });



    //////////////////
    //////////////////
    //////////////////
    ////////////////// Build
    
    gulp.task('build-less-components', function() {
        return gulp.src(addEach(componentPaths,'/**/styles.less'))
            .pipe($.less())
            .pipe($.prefix("last 1 version", "> 1%", "ie 8", "ie 7"))
            .pipe($.rename(function(path) {
                path.basename = path.dirname;
                path.dirname = '';
            }))
            .pipe($.minifyCSS({keepBreaks:true}))
            .pipe(gulp.dest('./public/zetam/css/components/'));
    })

    gulp.task('build-less-pages', function() {
        return gulp.src(addEach(pagesPaths,'/**/styles.less'))
            .pipe($.less())
            .pipe($.prefix("last 1 version", "> 1%", "ie 8", "ie 7"))
            .pipe($.rename(function(path) {
                path.basename = path.dirname;
                path.dirname = '';
            }))
            .pipe($.minifyCSS({keepBreaks:true}))
            .pipe(gulp.dest('./public/zetam/css/pages/'));
    })

    gulp.task('build-less',['build-less-components','build-less-pages']);


    // Browserify

    gulp.task('build-browserify-components', function() {
        var browserified = transform(function(filename) {
            var b = browserify(filename);
            return b.bundle();
        });

        return gulp.src(addEach(componentPaths,'/**/view.js'))
            .pipe(browserified)
            .pipe($.rename(function(path) {
                path.basename = path.dirname;
                path.dirname = '';
            }))
            .pipe($.uglify())
            .pipe(gulp.dest('./public/zetam/js/components/'));
    })

    gulp.task('build-browserify-pages', function() {

        var browserified = transform(function(filename) {
            var b = browserify(filename);
            return b.bundle();
        });


        return gulp.src(addEach(pagesPaths,'/**/view.js'))
            .pipe(browserified)
            .pipe($.rename(function(path) {
                path.basename = path.dirname;
                path.dirname = '';
            }))
            .pipe($.uglify())
            .pipe(gulp.dest('./public/zetam/js/pages/'));
    })

    gulp.task('build-browserify',['build-browserify-components','build-browserify-pages']);

    //////////////////
    //////////////////
    //////////////////
    //////////////////
    //////////////////


    // Livereload
    var templatesPaths = addEach(componentPaths,'/**/*.html')
        .concat(addEach(pagesPaths,'/**/*.html'));

    gulp.task('templates',function(){
        gulp.watch(templatesPaths).on('change', livereload.changed);
    });

    gulp.task('livereload',function(){
        livereload.listen();
    });

    // Express
    gulp.task('server',function() {
        return $.nodemon({
            script: 'app.js',
            ext: 'js json',
            ignore: ['**/view.js','public/**'], 
            env: {
                'NODE_ENV': 'development',
                'PORT': conf.expressPort
            }
        })
        .on('restart', function() {
            console.log('express restarted!')
        });
    });

    gulp.task('zetam', ['zetam-build','livereload','browserify','less','templates','server']);
    gulp.task('zetam-build',['build-browserify','build-less']);

}