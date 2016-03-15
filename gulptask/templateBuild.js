//遍历模版文件中需要
var path='build/html/'

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
    var cssOrginCodes = content.match(/<!--css ls build-->[\s|\S]*?<!--css ls endbuild-->/g)
  //  console.log(cssOrginCodes)
    var cssDistCodes = [];
    for (var k in cssOrginCodes){
        var insideHrefs = cssOrginCodes[k].match(/\w*\.css/g)
        if(insideHrefs){ //match out href="test.css"
           for(var i in insideHrefs ){
               if(json[insideHrefs[i]]){
                   cssOrginCodes[k]+='<script id="'+insideHrefs[i]+'">lsloader.loadCss('+insideHrefs[i]+','+json[insideHrefs[i]]+')</script>'
               }
           }
        }
        cssOrginCodes[k].replace(/<!--css ls build-->[\s|\S]*?<!--css ls endbuild-->/,'');
    }

    content.replace(/<!--css ls build-->[\s|\S]*?<!--css ls endbuild-->/g,function(cssOrginCodes){
        var insideHrefs = cssOrginCodes.match(/\w*\.css/g)
        if(insideHrefs){ //match out href="test.css"
            for(var i in insideHrefs ){
                if(json[insideHrefs[i]]){
                    cssOrginCodes+='<script id="'+insideHrefs[i]+'">lsloader.loadCss('+insideHrefs[i]+','+json[insideHrefs[i]]+')</script>'
                }
            }
        }
        return cssOrginCodes.replace(/<!--css ls build-->[\s|\S]*?<!--css ls endbuild-->/,'');
    })
    console.log(content)


    //var preloadScript= content.match(/<script build=\'preload\'>[\s|\S]*<\/script>/)
    //
    //preloadScript= preloadScript[0].replace(/build=\'preload\'/,'');
    //
    //var staticArry= preloadScript.match(/\S*\.css|\S*\.js/g) //所有准备替换的静态资源
    //
    //var staticString = ''//替换后的静态地址
    //for(var i in staticArry){
    //    if(json[staticArry[i]]){
    //        preloadScript = preloadScript.replace(new RegExp(staticArry[i],'g'),json[staticArry[i]]);
    //    }
    //}
    //
    //return content.replace(/<script build=\'preload\'>[\s|\S]*<\/script>/,preloadScript)


}

var exports = {};

exports.run=function(){
    var json
    var data = fs.readFileSync("build/rev-manifest.json","utf-8")
    data = JSON.parse(data)
    compileFile(data)
    console.log('preload success')
}

module.exports = exports;