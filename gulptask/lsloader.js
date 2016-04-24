/**
 * lsloader 动态异步加载,css需要注意防止reflow ,js需要注意所有同步顺序脚本都要用lsloader编译,避免出错
 * codestartv1 ls版本号,改动这个版本号 所有ls作废.
 * lsloader.load(name,path)
 * name  根据路径生成的唯一localStorage key
 * path 线上的打包后文件路径
 * onload css 文件加载完成后回调 用于避免异步css造成的reflow
 */

(function(){


    window.lsloader = {
        jsRunSequence:[], //js 运行队列 {name:代码name,code:代码,status:状态 failed/loading/comboJS,path:线上路径}
        jsnamemap:{},     //js name map 防fallback 重复请求资源
        cssnamemap:{}      //css name map 防fallback 重复请求资源
    };

    //封装LocalStorage方法
    lsloader.removeLS = function(key){
        try{
            localStorage.removeItem(key)
        }catch (e){}
    };
    lsloader.setLS = function (key,val){
        try{
            localStorage.setItem(key,val);
        }catch(e){
        }
    }
    lsloader.getLS = function(key){
        var val = ''
        try{
            val = localStorage.getItem(key);
        }catch (e){
            val = '';
        }
        return val
    }


    //读取资源到模板中
    lsloader.load = function(jsname,jspath,cssonload){
        cssonload = cssonload || function(){};
        var code;
        code = this.getLS(jsname);

        if(!/\/\*codestartv1\*\//.test(code)){   //ls 版本 codestartv1 每次换这个版本 所有ls作废
            this.removeLS(jsname);
            this.requestResource(jsname,jspath,cssonload);
            return
        }
        //取出对应文件名下的code
        if(code){
            var versionNumber = code.split('/*codestartv1*/')[0]; //取出路径版本号 如果要加载的和ls里的不同,清理,重写
            if(versionNumber!=jspath){
                this.removeLS(jsname);
                this.requestResource(jsname,jspath,cssonload);
                return
            }
            code = code.split('/*codestartv1*/')[1];
            if(/\.js$/.test(versionNumber)){
                this.jsRunSequence.push({name:jsname,code:code})
                this.runjs(jspath,jsname,code);
            }else{
                document.getElementById(jsname).appendChild(document.createTextNode(code));
                cssonload();
            }
        }else{
            //null xhr获取资源
            this.requestResource(jsname,jspath,cssonload);
        }
    };


    lsloader.requestResource = function(name,path,cssonload){
        var that = this
        if(/\.js$/.test(path)) {
            this.iojs(path,name,function(path,name,code){
                that.setLS(name,path+'/*codestartv1*/'+code)
                that.runjs(path,name,code);
            })
        }else if(/\.css$/.test(path)){
            this.iocss(path,name,function(code){
                document.getElementById(name).appendChild(document.createTextNode(code));
                that.setLS(name,path+'/*codestartv1*/'+code)
            },cssonload)
        }

    };

    //ajax 请求资源
    lsloader.iojs = function(path,jsname,callback){
        var that = this;
        that.jsRunSequence.push({name:jsname,code:''})
        try{
            var xhr = new XMLHttpRequest();
            xhr.open("get",path,true);
            xhr.onreadystatechange = function(){
                if (xhr.readyState == 4){
                    if((xhr.status >=200 && xhr.status < 300 ) || xhr.status == 304){
                        if(xhr.response!=''){
                            callback(path,jsname,xhr.response);
                            return;
                        }
                    }
                    that.jsfallback(path,jsname);
                }
            };
            xhr.send(null);
        }catch(e){
            that.jsfallback(path,jsname);
        }

    };

    lsloader.iocss = function(path,jsname,callback,cssonload){
        var that = this;
        try{
            var xhr = new XMLHttpRequest();
            xhr.open("get",path,true);
            xhr.onreadystatechange = function(){
                if (xhr.readyState == 4){
                    if((xhr.status >=200 && xhr.status < 300 ) || xhr.status == 304){
                        if(xhr.response!=''){
                            callback(xhr.response);
                            cssonload();
                            return;
                        }
                    }
                    that.cssfallback(path,jsname,cssonload);
                }
            };
            xhr.send(null);

        }catch(e){
            that.cssfallback(path,jsname,cssonload);
        }

    };

    lsloader.runjs = function(path,name,code){
        if(!!name&&!!code) {    //如果有 name code ,xhr来的结果,写入ls 否则是script.onload调用
            for (var k in this.jsRunSequence) {
                if (this.jsRunSequence[k].name == name) {
                    this.jsRunSequence[k].code = code;
                }
            }
        }
        if(!!this.jsRunSequence[0]&&this.jsRunSequence[0].code!=''&&this.jsRunSequence[0].status!='failed'){ //每次进入runjs检查,如果第一项有代码,执行并剔除队列,回调
            var script= document.createElement('script');
            var root = document.getElementsByTagName('script')[0];
            script.appendChild(document.createTextNode(this.jsRunSequence[0].code));
            root.parentNode.insertBefore(script, root);
            this.jsRunSequence.shift();
            if(this.jsRunSequence.length>0) {
                this.runjs();
            }
        }else if(!!this.jsRunSequence[0]&&this.jsRunSequence[0].status=='failed'){
            var that = this;
            var script = document.createElement('script');
            script.src = this.jsRunSequence[0].path;
            this.jsRunSequence[0].status = 'loading'
            script.onload=function(){
                that.jsRunSequence.shift();
                if(that.jsRunSequence.length>0){
                    that.runjs(); //如果jsSequence还有排队的 继续运行
                }
            };
            var root = document.getElementsByTagName('script')[0];
            root.parentNode.insertBefore(script, root);
        }
    }
    //<script src=''>页面阻塞下载转为异步加载流,防止同步改异步后破坏js运行顺序
    lsloader.tagLoad = function(path,name){
        this.jsRunSequence.push({name:name,code:'',path:path,status:'failed'});
        this.runjs();
    }

    //js回退加载 this.jsnamemap[name] 存在 证明已经在队列中 放弃
    lsloader.jsfallback = function(path,name){
        if(!!this.jsnamemap[name]){
            return;
        }else{
            this.jsnamemap[name]=name;
        }
        //jsRunSequence队列中 找到fail的文件,标记他,等到runjs循环用script请求
        for (var k in this.jsRunSequence) {
            if (this.jsRunSequence[k].name == name) {
                this.jsRunSequence[k].code = '';
                this.jsRunSequence[k].status='failed';
                this.jsRunSequence[k].path=path;
            }
        }
        this.runjs();
    };
    lsloader.cssfallback =function(path,name,cssonload){
        if(!!this.cssnamemap[name]){
            return;
        }else{
            this.cssnamemap[name]=1;
        }
        var link= document.createElement('link');
        link.type='text/css';
        link.href=path;
        link.rel='stylesheet';
        link.onload = link.onerror = cssonload;
        var root = document.getElementsByTagName('script')[0];
        root.parentNode.insertBefore(link, root)
    }


    lsloader.runInlineScript = function(scriptId,codeId){
        var code = document.getElementById(codeId).innerText;
        this.jsRunSequence.push({name:scriptId,code:code})
        this.runjs()
    }
    //jslist [{name:名称,path:线上路径}]
    lsloader.loadCombo = function(jslist){
        var updateList = '';// 待更新combo模块列表
        var requestingModules = {};//存储本次更新map
        for (var k in jslist){
            var LS = this.getLS(jslist[k].name);
            if(!!LS){
                var version = LS.split('/*codestartv1*/')[0]
                var code = LS.split('/*codestartv1*/')[1]
            }else{
                var version = '';
            }
            if(version == jslist[k].path){
                this.jsRunSequence.push({name:jslist[k].name,code:code,path:jslist[k].path}) // 缓存有效 代码加入runSequence
            }else{
                this.jsRunSequence.push({name:jslist[k].name,path:jslist[k].path,status:'comboloading'}) //  缓存无效 代码加入运行队列 状态loading
                requestingModules[jslist[k].name] = true;
                updateList+=(updateList==''?'':'&')+jslist[k].path;
            }
        }
        var that = this;
        var xhr = new XMLHttpRequest();
        xhr.open("get",updateList,true);
        xhr.onreadystatechange = function(){
            if (xhr.readyState == 4){
                if((xhr.status >=200 && xhr.status < 300 ) || xhr.status == 304){
                    if(xhr.response!=''){
                        that.runCombo(xhr.response,requestingModules);
                        return;
                    }
                }else{
                    for(var i in that.jsRunSequence){
                       if( requestingModules[that.jsRunSequence[i].name]){
                           that.jsRunSequence[i].status = 'failed'
                       }
                    }
                    that.runjs();
                }
            }
        };
        xhr.send(null);
        this.runjs();
    }
    lsloader.runCombo = function(comboCode,requestingModules){
        comboCode = comboCode.split('/*combojs*/');
        comboCode.shift();//去除首个空code
        for (var k in this.jsRunSequence) {
            if ( !!requestingModules[this.jsRunSequence[k].name]) {
                this.jsRunSequence[k].status = 'comboJS';
                this.jsRunSequence[k].code = comboCode[0];
                this.setLS(this.jsRunSequence[k].name,this.jsRunSequence[k].path+'/*codestartv1*/'+comboCode[0]);
                comboCode.shift();
            }
        }
        this.runjs();
    }

})()/**
 * Created by yanghuanyu on 16/3/19.
 */