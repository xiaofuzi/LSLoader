var webpack = require('webpack');
var fs = require('fs');

var entryPath =  './webpack_entry.json';
var entryString = fs.readFileSync(entryPath, 'utf8');
var entry = JSON.parse(entryString);

module.exports = {
    //插件项
    plugins: [
        new webpack.optimize.CommonsChunkPlugin({
            name:'common',
            filename : 'common_[chunkhash].js'
        }),
        new webpack.HashedModuleIdsPlugin()
    ],
        //页面入口文件配置
        entry: entry,
        //入口文件输出配置
        output: {
        path: './build/webpack2',
            filename: 'page[name]_[chunkhash].js'
    },
    module: {
        //加载器配置
        loaders: [
            { test: /\.css$/, loader: 'style-loader!css-loader' },
            {
                test: /\.js$/,
                loader: 'babel-loader',
                exclude: function(path) {
                    // 路径中含有 node_modules 的就不去解析。
                    var isNpmModule = !!path.match(/node_modules/);
                    return isNpmModule;
                }
            },
            { test: /\.scss$/, loader: 'style!css!sass?sourceMap'},
            { test: /\.(png|jpg)$/, loader: 'url-loader?limit=8192'},
            { test: /\.vue$/, loader: 'vue-loader'}
        ]
    },
    watch: false
}