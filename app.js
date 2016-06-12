var express = require('express');
var app = express();

var fs= require("fs");

app.use(express.static('build'));


app.get('/', function (req, res) {
    res.sendfile("build/html/index.html");
});

app.get('/combo', function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    var combos = req.param('combo').split(';');
    combos=combos || req.param('combo');
    var result = '';
    for(var i in combos){
        result+=fs.readFileSync("build/"+combos[i],"utf-8");
    }
    res.send(result)
});

var server = app.listen(3000, function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log('Example app listening at http://%s:%s', host, port);
});