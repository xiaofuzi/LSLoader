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

    //css 替换
    content= content.replace(/<!--css ls build-->[\s|\S]*?<!--css ls endbuild-->/g,function(cssOrginCodes){
        var insideHrefs = cssOrginCodes.match(/[^'"]*\.css/g)
        if(insideHrefs){ //match out href="test.css"
            for(var i in insideHrefs ){
                if(json[insideHrefs[i]]){
                    cssOrginCodes+='<style id="'+insideHrefs[i]+'"></style><script>lsloader.load("'+insideHrefs[i]+'","'+staticPath+json[insideHrefs[i]]+'" )</script>'
                }
            }
        }
        return cssOrginCodes.replace(/<!--css ls build-->[\s|\S]*?<!--css ls endbuild-->/,'');
    })

    // js 替换
    content= content.replace(/<!--js ls build-->[\s|\S]*?<!--js ls endbuild-->/g,function(cssOrginCodes){
        var insideHrefs = cssOrginCodes.match(/[^'"]*\.js/g);
        if(insideHrefs){ //match out href="test.css"
            for(var i in insideHrefs ){ 
                if(json[insideHrefs[i]]){
                    cssOrginCodes+='<script id="'+insideHrefs[i]+'"></script><script>lsloader.load("'+insideHrefs[i]+'","'+staticPath+json[insideHrefs[i]]+'" )</script>'
                }
            }
        }

        return cssOrginCodes.replace(/<!--js ls build-->[\s|\S]*?<!--js ls endbuild-->/,'');
    })

    // inline js 替换
    var inlinejsCount = 0;
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

    // 外域js 不缓存，只异步加载
    var tagload = 0;
    content= content.replace(/<!--js scriptload build-->[\s|\S]*?<!--js scriptload endbuild-->/g,function(cssOrginCodes){
        var insideHrefs = cssOrginCodes.match(/[^'"]*\.js/g);//console.log(insideHrefs)
        if(insideHrefs){ //match out href="test.js"
            for(var i in insideHrefs ){
                tagload++;
                cssOrginCodes+='<script>lsloader.tagLoad("'+insideHrefs[i]+'","ls-loader-tagload'+tagload+'" )</script>'
            }
        }
        return cssOrginCodes.replace(/<!--js scriptload build-->[\s|\S]*?<!--js scriptload endbuild-->/,'');
    })

    //替换lsloader.js入行内
    content= content.replace(/<!--lsloder build-->[\s|\S]*?<!--lsloder build-->/,function(cssOrginCodes){
        var content = fs.readFileSync('gulptask/lsloader.js',"utf-8")
        return cssOrginCodes.replace(/<!--lsloder build-->[\s|\S]*?<!--lsloder build-->/,'<script>'+content+'</script>');
    })

    return content

}

var exports = {};

exports.run=function(){
    var json
    var data = fs.readFileSync("build/rev-manifest.json","utf-8")
    data = JSON.parse(data)
    compileFile(data)
    console.log('templatebuild success')
}

module.exports = exports;