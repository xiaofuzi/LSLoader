define('AmdModule',['common/test'],function(test){
    return function(){
        $('body').append('AMDRunning:the test number is '+test.testNumber);
        $('body').append('</br>this is new version');
<<<<<<< HEAD

        var map = new AMap.Map('container', {
            resizeEnable: true,
            zoom:11,
            center: [116.397428, 39.90923]

        });
=======
>>>>>>> 2f70e640e9d2ac01ef963088f39187275e09d9c6
    }
})