var gulp = require('gulp');
var rev = require('gulp-rev');
var path='build/html/'
var clean = require('gulp-clean');

var gulpCopy = require('gulp-file-copy');



var fs=require("fs");  
function compileFile(json){
 fs.readdir(path, function(err, files) {
     files.forEach(function(item){
        if(/\.*\.html/.test(item)){
         var content = fs.readFileSync(path+item,"utf-8") 
         content = replaceContent(content,json) //替换内部preload的资源地址
        
           fs.writeFileSync(path+item,content,"utf-8")

          }   
     })
 })
}

function replaceContent(content,json){
   var preloadScript= content.match(/<script build=\'preload\'>[\s|\S]*<\/script>/)

   preloadScript= preloadScript[0].replace(/build=\'preload\'/,'');

   var staticArry= preloadScript.match(/\S*\.css|\S*\.js/g) //所有准备替换的静态资源

   var staticString = ''//替换后的静态地址
   for(var i in staticArry){
   	   if(json[staticArry[i]]){
          preloadScript = preloadScript.replace(new RegExp(staticArry[i],'g'),json[staticArry[i]]);
        }
   }

   return content.replace(/<script build=\'preload\'>[\s|\S]*<\/script>/,preloadScript)


}
 
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

gulp.task('preload',function(){
	 var json 
	 var data = fs.readFileSync("build/rev-manifest.json","utf-8") 
	 data = JSON.parse(data)
     compileFile(data)
     console.log('preload success')
})

gulp.task('default',['clean','copy','build'],function(){
   gulp.run('preload')
})