//遍历模版文件

var staticPath=''   //要附加的静态路径

var fs=require("fs");
function compileFile(json,paths){
    paths.forEach(function (path) {
        walk(path)
    })

    function walk(path) {
        fs.readdir(path, function (err, files) {

            files.forEach(function(item) {
                if(fs.statSync(path+item).isFile()){
                    fileReplace(path,item)
                }
                if(fs.statSync(path+item).isDirectory()){
                    walk(path+item+'/')
                }
            })
        })
    }
    function fileReplace(path) {
        fs.readdir(path, function (err, files) {
            files.forEach(function (item) {
                if (/\.*\.html|\.*\.ftl/.test(item)) {
                    var content = fs.readFileSync(path + item, "utf-8")
                    content = replaceContent(content, json) //替换内部preload的资源地址

                    fs.writeFileSync(path + item, content, "utf-8")

                }
            })
        })
    }

}
var tagLoadCount = 0;
var inlinejsCount = 0;  //全局变量防止inlineId tagLoadId再不同模版间重复
function replaceContent(content,json){

    //<!--css ls build--><link href="1.css" onload="function(){}"/><!--css ls endbuild-->
    content= content.replace(/<!--css ls build-->[\s|\S]*?<!--css ls endbuild-->/g,function(cssOrginCodes){
        var insideHrefs = cssOrginCodes.match(/[^'|^"]*\.css/g)
        if(insideHrefs){ //match out href="test.css"
            for(var i in insideHrefs ){
                if(json[insideHrefs[i]]){
                    try{
                        var onload = cssOrginCodes.match(/onload="[\s|\S]*?"/)[0].match(/"[\s|\S]*?"/)[0];
                        onload = 'function(){'+onload.replace(/\"/g,'')+'}'
                    }catch (e){
                        var onload = null
                    }

                    if(onload){
                        cssOrginCodes+='<style id="'+json[insideHrefs[i]]+'"></style><script>lsloader.load("'+json[insideHrefs[i]]+'","'+insideHrefs[i]+'",'+onload+' )</script>'
                    }else{
                        cssOrginCodes+='<style id="'+json[insideHrefs[i]]+'"></style><script>lsloader.load("'+json[insideHrefs[i]]+'","'+insideHrefs[i]+'" )</script>'
                    }

                }
            }
        }
        return cssOrginCodes.replace(/<!--css ls build-->[\s|\S]*?<!--css ls endbuild-->/,'');
    })


    content= content.replace(/<!--js ls build-->[\s|\S]*?<!--js ls endbuild-->/g,function(cssOrginCodes){
        var insideHrefs = cssOrginCodes.match(/[^'|^"]*\.js/g)
        if(insideHrefs){ //match out href="test.css"
            for(var i in insideHrefs ){
                if(json[insideHrefs[i]]){
                    cssOrginCodes+='<script id="'+json[insideHrefs[i]]+'"></script><script>lsloader.load("'+json[insideHrefs[i]]+'","'+insideHrefs[i]+'" )</script>'
                }
            }
        }
        return cssOrginCodes.replace(/<!--js ls build-->[\s|\S]*?<!--js ls endbuild-->/,'');
    })


    content = content.replace(/<!--js tagload build-->[\s|\S]*?<!--js tagload endbuild-->/g,function(inlinejs){
        var inlinejsCodes = inlinejs.match(/[^'|^"]*\.js/g)
        if(inlinejsCodes){
            for(var i in inlinejsCodes) {
                tagLoadCount++;
                inlinejs += '<script>lsloader.tagLoad("' + inlinejsCodes[i] + '","ls-loader-tagload' + tagLoadCount + '")</script>'
            }
        }
        return inlinejs.replace(/<!--js tagload build-->[\s|\S]*?<!--js tagload endbuild-->/,'');
    })


    content = content.replace(/<!--js inline build-->[\s|\S]*?<!--js inline endbuild-->/g,function(inlinejs){
        var inlinejsCodes = inlinejs.match(/(<script[^>]*?>)([\s\S]*?)(<\/script>)/i)[2]
        if(inlinejsCodes){
            inlinejsCount++;
            inlinejs ='';
            inlinejs +='<textarea style="display:none" id="ls-loader-inlinecode'+inlinejsCount+'">'+inlinejsCodes+'</textarea>'
            inlinejs += '<script id="ls-loader-inlinerun'+inlinejsCount+'"></script>'
            inlinejs += '<script>lsloader.runInlineScript("ls-loader-inlinerun'+inlinejsCount+'","ls-loader-inlinecode'+inlinejsCount+'")</script>'
        }
        return inlinejs.replace(/<!--js inline build-->[\s|\S]*?<!--js inline endbuild-->/,'');
    })

    //替换lsloader.js入行内
    content= content.replace(/<!--lsloder build-->[\s|\S]*?<!--lsloder endbuild-->/,function(cssOrginCodes){
        var content = fs.readFileSync('./gulptask/lsloader.js',"utf-8")
        return cssOrginCodes.replace(/<!--lsloder build-->[\s|\S]*?<!--lsloder endbuild-->/,'<script>'+content+'</script>');
    })

    return content

}

var exports = {};

exports.run=function(args){
    var path = args.path;

    var json
    var data = fs.readFileSync("./build/rev-manifest.json","utf-8")
    data = JSON.parse(data)

    compileFile(data,path)
    console.log('templatebuild success')
}

module.exports = exports;