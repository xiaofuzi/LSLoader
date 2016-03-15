var gulp = require('gulp');
var rev = require('gulp-rev');

var clean = require('gulp-clean');





 
gulp.task('clean', function () {
     return gulp.src('build/', {read: false})
    .pipe(clean());
});

gulp.task('copy',['clean'],function(){
        return gulp.src(['dev/**/'])
         .pipe(gulp.dest('build/'))

})

gulp.task('build',['copy'], function () {
    // by default, gulp would pick `assets/css` as the base,
    // so we need to set it explicitly:
   return  gulp.src(['build/**/*.css', 'build/**/*.js'])
        .pipe(rev())
        .pipe(gulp.dest('build/'))  // write rev'd assets to build dir
        .pipe(rev.manifest())
        .pipe(gulp.dest('build/')); // write manifest to build dir
 
});

gulp.task('lsload',function(){
      require('./gulptask/templateBuild').run()
})

gulp.task('default',['clean','copy','build'],function(){
   gulp.run('lsload')
})