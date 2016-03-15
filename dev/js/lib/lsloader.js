(function(){

    window.lsloader = {};

    //读取资源到模板中
    lsloader.load = function(jsname,jspath){
         var code = localStorage.getItem(jsname)
         if(code){
             document.getElementById(jsname).appendChild(document.createTextNode(code))
         }else{
             lsloader.io(jspath,function(code){
                 document.getElementById(jsname).appendChild(document.createTextNode(code))
                 localStorage.setItem(jsname,code);
             })
         }
    }

    lsloader.io = function(path,callback){
        var xhr = new XMLHttpRequest()
        xhr.open("get",path,true);
        xhr.onreadystatechange = function(){
            if (xhr.readyState == 4) {//readyState表示文档加载进度,4表示完毕
                callback(xhr.responseText);//responseText属性用来取得返回的文本
            }
        }
        xhr.send(null);
    }



})()