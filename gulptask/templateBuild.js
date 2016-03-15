//遍历模版文件中需要
var path='build/html/' //要编译的路径
var staticPath='../'   //要附加的静态路径

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


    content= content.replace(/<!--css ls build-->[\s|\S]*?<!--css ls endbuild-->/g,function(cssOrginCodes){
        var insideHrefs = cssOrginCodes.match(/\w*\.css/g)
        if(insideHrefs){ //match out href="test.css"
            for(var i in insideHrefs ){
                if(json[insideHrefs[i]]){
                    cssOrginCodes+='<style id="'+insideHrefs[i].replace('.','_')+'"></style><script>lsloader.load("'+insideHrefs[i].replace('.','_')+'","'+staticPath+json[insideHrefs[i]]+'" )</script>'
                }
            }
        }
        return cssOrginCodes.replace(/<!--css ls build-->[\s|\S]*?<!--css ls endbuild-->/,'');
    })


    content= content.replace(/<!--js ls build-->[\s|\S]*?<!--js ls endbuild-->/g,function(cssOrginCodes){
        var insideHrefs = cssOrginCodes.match(/\w*\.js/g)
        if(insideHrefs){ //match out href="test.css"
            for(var i in insideHrefs ){
                if(json[insideHrefs[i]]){
                    cssOrginCodes+='<script id="'+insideHrefs[i].replace('.','_')+'"></script><script>lsloader.load("'+insideHrefs[i].replace('.','_')+'","'+staticPath+json[insideHrefs[i]]+'" )</script>'
                }
            }
        }
        return cssOrginCodes.replace(/<!--js ls build-->[\s|\S]*?<!--js ls endbuild-->/,'');
    })

    return content

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