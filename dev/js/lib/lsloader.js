(function(){

    window.lsloader = {};

    //读取资源到模板中
    lsloader.load = function(jsname,jspath){
         var code = localStorage.getItem(jsname)
         //取出对应文件名下的code
         if(code){
             var versionNumber = code.split('/*codestart*/')[0] //取出路径版本号 如果要加载的和ls里的不同,清理,重写
             if(versionNumber!=jspath){
                 this.removeLS(jsname);
                 this.requestResource(jsname,jspath);
                 return
             }
             code = code.split('/*codestart*/')[1]
             document.getElementById(jsname).appendChild(document.createTextNode(code))
         }else{
             //null xhr获取资源
             this.requestResource(jsname,jspath);
         }
    }
    //卸载storage中的资源
    lsloader.removeLS = function(key){
        localStorage.removeItem(key)
    }

    lsloader.requestResource = function(jsname,jspath){
        this.io(jspath,function(code){
            document.getElementById(jsname).appendChild(document.createTextNode(code))
            try{
                localStorage.setItem(jsname,jspath+'/*codestart*/'+code);
            }catch(e){
            }
        })
    }

    //ajax 请求资源
    lsloader.io = function(path,callback){
        var xhr = new XMLHttpRequest()
        xhr.open("get",path,true);
        xhr.onreadystatechange = function(){
            if (xhr.readyState == 4){//readyState表示文档加载进度,4表示完毕
                callback(xhr.responseText);//responseText属性用来取得返回的文本
            }
        }
        xhr.send(null);
    }



})()