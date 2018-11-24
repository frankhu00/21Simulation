const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

var config = {
    target: 'electron-renderer',
    entry: ['@babel/polyfill', './app/src/app.js'],
    output: {
        publicPath: 'dist/',
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'app/dist')
    },
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                exclude: /(node_modules|bower_components)/,
                use: ['babel-loader']
            },
            {
                test: /\.css$/,
                loader: ExtractTextPlugin.extract({
                    loader: 'css-loader',
                    options: {
                        modules: true
                    }
                })
            },
            {
                test: /\.(png|jpg|gif|svg)$/,
                loader: 'file-loader',
                query: {
                    name: '[name].[ext]?[hash]'
                }
            }
        ]
    },
    plugins: [
        new ExtractTextPlugin({
            filename: 'bundle.css',
            disable: false,
            allChunks: true
        })
    ],
    resolve: {
        extensions: ['.js', '.jsx']
    }
};

module.exports = config;