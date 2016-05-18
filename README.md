# LSLoader
localStorage loader to increase mobile webapp speed

一 项目背景
外卖I版页面,红包页面每天访问量很大,其中红包页在微信Webview中访问为主,
但是微信webview的缓存有已知如下问题:
1 微信webview退出10分钟后,js css 缓存失效,触发304;
2 微信webview进程退出,重新进入后,缓存作废,触发200;
在日常场景中,用户访问一次红包页后再次访问期间会间隔很长时间,
单纯的浏览器缓存微信客户端内命中率较低,同时移动网络延时较高,
304,200情况下用户开始加载红包到可以领取需要3-4s时间其中2.5s时间用于css js下载.
为了解决这个问题,外卖I版决定引入LocalStorage当作缓存来让前端工程化控制文件缓存.
LsLoader相对于其他接近方案,有兼容性好,时效性长,以及便于js工程化的特点.业内有美团
主站,百度移动版,滴滴移动端使用了这种方案,效果明显.

二 技术选型
主站目前已有truckJS解决方案
http://git.sankuai.com/projects/MFE/repos/truckjs/browse,
技术基本原理是前端重新定义了require,define函数,重写AMD加载器,
结合上线时打包进行AST语法分析进行依赖分析,浏览器端按照AMD模块粒度进行缓存
如果模块有变化,combo服务把所有变化文件进行更新,省流量省加载时间.

truckJS功能强大,但是使用时候依赖AMD结构,不支持非AMD模块,不支持行内脚本顺序执行,
不支持顶部css 缓存,同时AMD加载为了达到效果必须要有线上combo才可以发挥出极致.

对应我们的红包页面,里面混杂了外站js,非AMD js接口,页面行内脚本依赖外引非AMD js.
红包页面css样式有两个请求,需要缓存优化.

三 Why LsLoader--一个并行加载顺序执行,最贴近原生js模式的本地缓存库
不同于truckJS架构对AMD加载器的依赖,LsLoader运行方式模仿原生js css的加载方式,
css异步加载,样式在页面顺序按照编码是顺序保证正确;
js 异步加载,顺序执行,有序性保证xhr加载的js 本地缓存的js 标签加载的js 以及行内
js按照出现顺序执行.
由于不重写define/require,LsLoader在js缓存时可以选用线下打包,不依赖后端线上
combo服务.如果想用combo达到AMD文件粒度的缓存,LsLoader也有runCombo和loadCombo方法(
目前线上服务Demo未提供,只有Mock模拟)
由于使用顺序运行逻辑,所有行内脚本亦可编译成迟缓运行的代码,css样式也可以开启异步加载.


四 代码原理
LsLoader线上代码会将每个css js文件利用异步的方式进行加载处理,代码本地缓存.
所有可以缓存的文件都以key:'相对路径,value : 线上路径/*codestart*/代码' 的方式存储到LocalStorage中来.
相对路径做key可以防止项目同名文件互相覆盖,线上路径带有md5戳可以作版本标示.
<img src='http://wiki.sankuai.com/download/attachments/450467260/lsLoader.001.jpeg?version=1&modificationDate=1462280066879&api=v2'/>

css使用xhr异步加载,加载成功后直接放入对应位置的内联style标签,由于内联标签顺序和css顺序一致,渲染结果可以达到和原生link加载一致效果.

js加载使用xhr异步加载,成功后代码放入待执行队列
其中,不支持跨域XHR的js使用script tag加载,但是异步js会立即执行,为了保证执行顺序,script加载的js统一为到需要执行时在加载,成功后回调继续.
行内脚本使用textarea包裹,到执行时机时取出内部text,append到新建script标签中即可达到执行效果



五 使用方式
LsLoader分两部分,一个是运行再客户端,压缩后2k大小的LsLoader.js,一个是运行在gulp环境里的打包程序templateBuild.js
任务配置:gulp调用templateBuild程序,传入唯一参数path,标示需要编译处理的模版文件
templateBuild文件头部jsonPath 配置上工程打包生成版本号生成的json文件,key-value对应写好本地相对路径和
线上带md5的路径.


开发时如同往常一样写自己的业务逻辑,css ,js, 对于需要加缓存的页面,顶部加入\<!--lsloder build--\>\<!--lsloder endbuild--\>注释
编译时压缩后的Lsloader.js代码会被引入页面
之后,页面内需要缓存的js css加入对应的注释代码,为编译工具标定需要处理的部分.

开发调试过后,运行上线脚本gulp,之前先进行md5打包,css js合并,最后一步templateBuild.js会把标示的js css加载标签替换为
lsloader加载方式,开启本地强缓存


关于css的缓存:
由于调用css时候需要使用异步模式,为了防止页面css乱序造成的repaint/reflow,
开发时候css link标签onload函数可以被编译成线上模版运行,
\<link rel="stylesheet" type="text/css" href='../css/page3.css' onload="document.documentElement.style.display='';"\>
在页面头部加入document.documentElement.style.display='none';主css加载完回调函数再修改display,即可防止repaint/reflow造成的
负面效果.

关于js的缓存:
js采用异步加载,顺序执行,所以所有需要保证运行顺序的js,包括外引/行内代码块,都要参与编译,才能让LsLoader决定执行顺序.





六 Demo 运行方式
根目录下npm install

运行gulp

运行node app.js 启动express

访问localhost:3000/ 即可看见打包后的代码

每次修改css/js后 gulp打包, 刷新页面 资源自动灰度更新缓存 最大化减少请求
 
build/html下即可看到打包localStorage的模版

放入自己的后端服务的目录结构中，运行
dev/html下是打包缓存前代码
build/html 下打包缓存后代码

格式 \<!--任务名 build--\>\<!--任务名 endbuild--\>
\<!--lsloder build--\>
 添加库文件

\<!--css ls build--\>
\<link rel="stylesheet" type="text/css" href='../css/page3.css' onload="document.documentElement.style.display='';"\>
\<!--css ls endbuild--\>

css引入 缓存 onload一定要加双引号 

\<!--js ls build--\>
\<script src='../js/jquery.js'\>
\<!--js ls endbuild--\>
js xhr引入 缓存

 \<!--js tagload build--\>
\<script src='http://res.wx.qq.com/open/js/jweixin-1.0.0.js'\>
\<!--js tagload endbuild--\>

外站js script tag 引入

 \<!--js inline build--\>

\<script\>
$(document.body).append('<div>????</div>');
console.log('?')
\<script\>

 \<!--js inline endbuild--\>

内联脚本运行

七 计划未来支持功能
1 图片强缓存,利用canvas toDataUrl方法缓存常用图标
2 comboJS ,LSLoader.loadCombo()方法已经支持多个js打包加载,后续会
学习truckJS提供gulp版本的本地语法分析,提取AMD文件依赖自动编译成LSLoader认可的格式.







