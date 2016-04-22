# LSLoader
localStorage loader to increase mobile webapp speed

运行方式 
根目录下npm install

运行gulp 
 
build/html下即可看到打包localStorage的模版

格式 <!--任务名 build--><!--任务名 endbuild-->
lsloder build
 添加库文件

css ls build
<link rel="stylesheet" type="text/css" href='../css/page3.css' onload="document.documentElement.style.display='';">
css ls endbuild

css引入 缓存 onload一定要加双引号 

js ls build
<script src='../js/jquery.js'></script>
js ls endbuild
js xhr引入 缓存

 js tagload build
<script src='http://res.wx.qq.com/open/js/jweixin-1.0.0.js'></script>
js tagload endbuild

外站js script tag 引入

js inline build
<script>$(document.body).append('<div>????</div>');
console.log('?')
</script>
js inline endbuild

内联脚本运行



